const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const POSSession = require('../models/POSSession');
const POSSale = require('../models/POSSale');
const OrderCounter = require('../models/OrderCounter');
const User = require('../models/User');
const InventoryManager = require('../utils/inventoryManager');
const GSTCalculator = require('../utils/gstCalculator');
const { auth, requireRole, requirePermission } = require('../middleware/auth');

// Open a POS session
router.post('/session/open', auth, requireRole('admin', 'manager', 'sales_staff'), async (req, res) => {
  try {
    const { storeId, warehouseId, terminal, openingCash } = req.body;

    // Check for already open session by this cashier
    const existing = await POSSession.findOne({ cashier: req.user._id, status: 'open' });
    if (existing) {
      return res.status(400).json({ message: 'You already have an open session', session: existing });
    }

    const sessionNumber = `POS-${Date.now()}`;

    const session = await POSSession.create({
      sessionNumber,
      cashier: req.user._id,
      store: storeId,
      warehouse: warehouseId,
      terminal: terminal || 'POS-01',
      openingCash: openingCash || 0,
      status: 'open'
    });

    res.status(201).json({ message: 'POS session opened', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Close a POS session
router.put('/session/:sessionId/close', auth, async (req, res) => {
  try {
    const { closingCash, notes } = req.body;

    const session = await POSSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.cashier.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const actualClosingCash = closingCash ?? 0;
    const expectedCash = session.openingCash + session.summary.totalCashSales - session.summary.totalRefunds;
    const cashDifference = actualClosingCash - expectedCash;

    session.status = 'closed';
    session.closedAt = new Date();
    session.closingCash = actualClosingCash;
    session.expectedCash = expectedCash;
    session.cashDifference = cashDifference;
    session.notes = notes;
    await session.save();

    res.json({
      message: 'POS session closed',
      session,
      cashVariance: cashDifference
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current session for logged-in cashier
router.get('/session/current', auth, async (req, res) => {
  try {
    const session = await POSSession.findOne({ cashier: req.user._id, status: 'open' })
      .populate('store', 'name code')
      .populate('cashier', 'name');

    if (!session) return res.status(404).json({ message: 'No open session found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Lookup product by barcode or name for POS
router.get('/product/lookup', auth, async (req, res) => {
  try {
    const { q, barcode } = req.query;

    let query = {};
    if (barcode) {
      query.barcode = barcode;
    } else if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { barcode: q }
      ];
    } else {
      return res.status(400).json({ message: 'Provide barcode or search query' });
    }

    const products = await Product.find({ ...query, stock: { $gt: 0 } })
      .select('name barcode price originalPrice discount stock category unit unitQuantity brand images image')
      .limit(10);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create POS sale (billing)
router.post('/sale', auth, async (req, res) => {
  try {
    const {
      sessionId,
      items,
      payments,
      customerPhone,
      customerName,
      customerId,
      couponCode,
      couponDiscount,
      loyaltyPointsRedeemed,
      isInterState
    } = req.body;

    const session = await POSSession.findById(sessionId);
    if (!session || session.status !== 'open') {
      return res.status(400).json({ message: 'No open POS session found' });
    }
    if (session.cashier.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate stock and fetch product details
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
      }

      const sellingPrice = item.overridePrice ?? (product.price * (1 - (product.discount || 0) / 100));
      const discount = product.price - sellingPrice;
      const lineTotal = sellingPrice * item.quantity;

      const rates = await GSTCalculator.getRate(product.category);
      const gst = GSTCalculator.calculate(lineTotal, rates.cgst, rates.sgst, { isInterState: isInterState || false });

      enrichedItems.push({
        product: product._id,
        name: product.name,
        barcode: product.barcode,
        quantity: item.quantity,
        mrp: product.originalPrice || product.price,
        sellingPrice,
        discount,
        discountType: 'flat',
        lineTotal,
        hsnCode: item.hsnCode,
        gstRate: rates.cgst + rates.sgst,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        batchNumber: item.batchNumber
      });
    }

    const subtotal = enrichedItems.reduce((s, i) => s + i.lineTotal, 0);
    const totalDiscount = enrichedItems.reduce((s, i) => s + (i.discount * i.quantity), 0);
    const totalCGST = enrichedItems.reduce((s, i) => s + i.cgst, 0);
    const totalSGST = enrichedItems.reduce((s, i) => s + i.sgst, 0);
    const totalIGST = enrichedItems.reduce((s, i) => s + i.igst, 0);
    const totalGST = totalCGST + totalSGST + totalIGST;

    let grandTotal = subtotal + totalGST - (couponDiscount || 0) - (loyaltyPointsRedeemed || 0) / 10;
    const roundOff = Math.round(grandTotal) - grandTotal;
    grandTotal = Math.round(grandTotal);

    const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
    if (amountPaid < grandTotal) {
      return res.status(400).json({ message: `Insufficient payment. Required: ₹${grandTotal}, Received: ₹${amountPaid}` });
    }

    const billNumber = await OrderCounter.nextOrderNumber('BIL');
    const loyaltyPointsEarned = Math.floor(grandTotal / 100);

    const sale = await POSSale.create({
      billNumber,
      session: sessionId,
      cashier: req.user._id,
      store: session.store,
      customer: customerId,
      customerPhone,
      customerName,
      items: enrichedItems,
      subtotal,
      totalDiscount,
      totalCGST,
      totalSGST,
      totalIGST,
      totalGST,
      roundOff,
      grandTotal,
      payments,
      amountPaid,
      changeReturned: amountPaid - grandTotal,
      couponCode,
      couponDiscount: couponDiscount || 0,
      loyaltyPointsRedeemed: loyaltyPointsRedeemed || 0,
      loyaltyPointsEarned,
      status: 'completed'
    });

    // Deduct stock
    for (const item of enrichedItems) {
      try {
        await InventoryManager.deductStock(item.product, item.quantity);
        await Product.findByIdAndUpdate(item.product, { $inc: { salesCount: item.quantity } });
      } catch (err) {
        console.error(`POS stock deduction error: ${err.message}`);
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, salesCount: item.quantity } });
      }
    }

    // Update session summary
    const cashAmount = payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0);
    const cardAmount = payments.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0);
    const upiAmount = payments.filter(p => p.method === 'upi').reduce((s, p) => s + p.amount, 0);

    await POSSession.findByIdAndUpdate(sessionId, {
      $inc: {
        'summary.totalSales': grandTotal,
        'summary.totalTransactions': 1,
        'summary.totalCashSales': cashAmount,
        'summary.totalCardSales': cardAmount,
        'summary.totalUPISales': upiAmount,
        'summary.totalDiscount': totalDiscount + (couponDiscount || 0),
        'summary.totalGST': totalGST,
        'summary.itemsSold': enrichedItems.reduce((s, i) => s + i.quantity, 0)
      }
    });

    // Award loyalty points to linked customer
    if (customerId) {
      await User.findByIdAndUpdate(customerId, {
        $inc: { loyaltyPoints: loyaltyPointsEarned - (loyaltyPointsRedeemed || 0), totalSpent: grandTotal }
      });
    }

    res.status(201).json({
      message: 'Sale completed',
      billNumber,
      grandTotal,
      changeReturned: amountPaid - grandTotal,
      loyaltyPointsEarned,
      sale
    });
  } catch (error) {
    console.error('POS sale error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Void / refund a POS sale
router.post('/sale/:saleId/void', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { reason } = req.body;
    const sale = await POSSale.findById(req.params.saleId);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    if (sale.status !== 'completed') return res.status(400).json({ message: 'Sale already voided or refunded' });

    // Restore stock
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, salesCount: -item.quantity }
      });
    }

    sale.status = 'void';
    sale.refundedAt = new Date();
    sale.refundReason = reason;
    await sale.save();

    // Update session summary
    await POSSession.findByIdAndUpdate(sale.session, {
      $inc: {
        'summary.totalRefunds': sale.grandTotal,
        'summary.totalSales': -sale.grandTotal,
        'summary.totalTransactions': -1
      }
    });

    res.json({ message: 'Sale voided and stock restored', sale });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sales for a session
router.get('/session/:sessionId/sales', auth, async (req, res) => {
  try {
    const sales = await POSSale.find({ session: req.params.sessionId })
      .sort({ createdAt: -1 })
      .populate('cashier', 'name')
      .populate('items.product', 'name barcode');

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bill by number
router.get('/bill/:billNumber', auth, async (req, res) => {
  try {
    const sale = await POSSale.findOne({ billNumber: req.params.billNumber })
      .populate('cashier', 'name')
      .populate('store', 'name address')
      .populate('customer', 'name phone');

    if (!sale) return res.status(404).json({ message: 'Bill not found' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Today's POS summary (admin/manager)
router.get('/summary/today', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const summary = await POSSale.aggregate([
      { $match: { createdAt: { $gte: todayStart }, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', '$$this.quantity'] } } } },
          totalGST: { $sum: '$totalGST' },
          totalDiscount: { $sum: '$totalDiscount' },
          avgBillValue: { $avg: '$grandTotal' }
        }
      }
    ]);

    res.json(summary[0] || { totalRevenue: 0, totalTransactions: 0, totalItems: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
