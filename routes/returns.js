const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const OrderCounter = require('../models/OrderCounter');
const { auth, requirePermission, requireRole } = require('../middleware/auth');

// Create return request (customer)
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, items, refundMethod } = req.body;

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });
    if (order.status !== 'Delivered') return res.status(400).json({ message: 'Can only return delivered orders' });

    // 30-day return window
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const daysSince = (Date.now() - deliveryDate) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) return res.status(400).json({ message: 'Return window expired (30 days from delivery)' });

    // Check for existing pending return
    const existing = await Return.findOne({ order: orderId, status: { $nin: ['rejected', 'refunded'] } });
    if (existing) return res.status(400).json({ message: 'A return request already exists for this order', return: existing });

    const totalRefundAmount = items.reduce((sum, i) => sum + (i.refundAmount || 0), 0);
    const rmaNumber = await OrderCounter.nextOrderNumber('RMA');

    const returnDoc = await Return.create({
      rmaNumber,
      order: orderId,
      customer: req.user._id,
      items,
      totalRefundAmount,
      refundMethod: refundMethod || 'original_payment',
      status: 'requested',
      requestDate: new Date()
    });

    // Update order status
    await Order.findByIdAndUpdate(orderId, {
      status: 'Return Requested',
      'returnRequest.status': 'Requested',
      'returnRequest.requestedAt': new Date()
    });

    const notificationService = req.app?.get('notificationService');
    if (notificationService) {
      await notificationService.sendOrderUpdate(req.user._id, orderId, 'Return Requested',
        `Your return request ${rmaNumber} has been submitted. Our team will review it within 24 hours.`
      );
    }

    res.status(201).json({ message: 'Return request submitted', return: returnDoc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer's returns
router.get('/my', auth, async (req, res) => {
  try {
    const returns = await Return.find({ customer: req.user._id })
      .populate('order', 'orderNumber totalAmount')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });

    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: List all returns
router.get('/', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const [returns, total] = await Promise.all([
      Return.find(query)
        .populate('customer', 'name email phone')
        .populate('order', 'orderNumber totalAmount')
        .populate('items.product', 'name')
        .sort({ requestDate: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Return.countDocuments(query)
    ]);

    res.json({ returns, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Approve return
router.put('/:id/approve', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const { refundMethod, notes } = req.body;

    const returnDoc = await Return.findById(req.params.id).populate('customer order');
    if (!returnDoc) return res.status(404).json({ message: 'Return not found' });
    if (returnDoc.status !== 'requested') return res.status(400).json({ message: 'Return is not in requested state' });

    returnDoc.status = 'approved';
    returnDoc.refundMethod = refundMethod || returnDoc.refundMethod;
    returnDoc.approvedDate = new Date();
    returnDoc.notes = notes;
    returnDoc.processedBy = req.user._id;
    await returnDoc.save();

    const notificationService = req.app?.get('notificationService');
    if (notificationService) {
      await notificationService.sendOrderUpdate(
        returnDoc.customer._id, returnDoc.order._id, 'Return Approved',
        `Your return ${returnDoc.rmaNumber} is approved. Please ship items back within 7 days.`
      );
    }

    res.json({ message: 'Return approved', return: returnDoc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Reject return
router.put('/:id/reject', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const { reason } = req.body;
    const returnDoc = await Return.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', notes: reason, processedBy: req.user._id },
      { new: true }
    ).populate('customer');

    if (!returnDoc) return res.status(404).json({ message: 'Return not found' });

    await Order.findByIdAndUpdate(returnDoc.order, { status: 'Delivered' });

    res.json({ message: 'Return rejected', return: returnDoc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Mark items received + inspect
router.put('/:id/received', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const { inspectionNotes, itemConditions } = req.body;
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) return res.status(404).json({ message: 'Return not found' });

    // Update item conditions based on inspection
    if (itemConditions) {
      itemConditions.forEach(({ productId, condition }) => {
        const item = returnDoc.items.find(i => i.product.toString() === productId);
        if (item) item.condition = condition;
      });
    }

    returnDoc.status = 'inspected';
    returnDoc.receivedDate = new Date();
    returnDoc.inspectionNotes = inspectionNotes;
    await returnDoc.save();

    res.json({ message: 'Return received and inspected', return: returnDoc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Complete refund and restock
router.put('/:id/complete', auth, requirePermission('process_refunds'), async (req, res) => {
  try {
    const { restockItems = true } = req.body;
    const returnDoc = await Return.findById(req.params.id).populate('items.product');
    if (!returnDoc) return res.status(404).json({ message: 'Return not found' });

    // Restock if items are in acceptable condition
    if (restockItems) {
      for (const item of returnDoc.items) {
        if (['unopened', 'opened'].includes(item.condition) && item.product) {
          await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: item.quantity } });
        }
      }
    }

    returnDoc.status = 'refunded';
    returnDoc.refundedDate = new Date();
    returnDoc.restockedDate = restockItems ? new Date() : null;
    returnDoc.processedBy = req.user._id;
    await returnDoc.save();

    await Order.findByIdAndUpdate(returnDoc.order, { status: 'Refunded' });

    // Deduct loyalty points for refunded amount
    await User.findByIdAndUpdate(returnDoc.customer, {
      $inc: {
        loyaltyPoints: -Math.floor(returnDoc.totalRefundAmount / 100),
        totalSpent: -returnDoc.totalRefundAmount
      }
    });

    res.json({ message: 'Return completed and refund processed', return: returnDoc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
