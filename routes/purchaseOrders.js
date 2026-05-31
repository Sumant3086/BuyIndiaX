const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const InventoryBatch = require('../models/InventoryBatch');
const InventoryManager = require('../utils/inventoryManager');
const { auth, requirePermission, requireRole } = require('../middleware/auth');

// List purchase orders
router.get('/', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const { status, supplier, page = 1, limit = 20, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query)
        .populate('supplier', 'name code email phone')
        .populate('store', 'name code')
        .populate('createdBy', 'name')
        .populate('items.product', 'name category unit')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      PurchaseOrder.countDocuments(query)
    ]);

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single PO
router.get('/:id', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('store', 'name address')
      .populate('items.product', 'name category unit barcode')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name');

    if (!po) return res.status(404).json({ message: 'Purchase order not found' });
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create purchase order
router.post('/', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { supplierId, storeId, items, expectedDeliveryDate, notes } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    const poNumber = `PO-${Date.now()}`;

    const enrichedItems = await Promise.all(items.map(async item => {
      const product = await Product.findById(item.productId).select('name price');
      return {
        product: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice || product?.price || 0,
        totalPrice: item.quantity * (item.unitPrice || product?.price || 0),
        receivedQuantity: 0
      };
    }));

    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const po = await PurchaseOrder.create({
      poNumber,
      supplier: supplierId,
      store: storeId,
      items: enrichedItems,
      totalAmount,
      expectedDeliveryDate,
      notes,
      createdBy: req.user._id,
      status: 'draft'
    });

    // Update supplier metrics
    await Supplier.findByIdAndUpdate(supplierId, { $inc: { 'metrics.totalOrders': 1, 'metrics.totalValue': totalAmount } });

    res.status(201).json({ message: 'Purchase order created', po });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve / send PO
router.put('/:id/approve', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'PO not found' });
    if (!['draft'].includes(po.status)) return res.status(400).json({ message: 'Can only approve draft POs' });

    po.status = 'sent';
    po.approvedBy = req.user._id;
    await po.save();

    res.json({ message: 'Purchase order approved and sent to supplier', po });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record goods receipt (GRN — Goods Received Note)
router.post('/:id/receive', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { receivedItems, warehouseId } = req.body;
    const po = await PurchaseOrder.findById(req.params.id).populate('supplier');
    if (!po) return res.status(404).json({ message: 'PO not found' });
    if (!['sent', 'confirmed', 'partially_received'].includes(po.status)) {
      return res.status(400).json({ message: 'PO cannot receive goods in current status' });
    }

    const batchesCreated = [];

    for (const received of receivedItems) {
      const poItem = po.items.find(i => i.product.toString() === received.productId);
      if (!poItem) continue;

      const qty = parseInt(received.quantity);
      if (qty <= 0) continue;

      poItem.receivedQuantity = (poItem.receivedQuantity || 0) + qty;

      // Create InventoryBatch record
      const batchNumber = received.batchNumber || `${po.poNumber}-${Date.now()}`;
      const batch = await InventoryBatch.create({
        product: received.productId,
        warehouse: warehouseId,
        batchNumber,
        quantity: qty,
        originalQuantity: qty,
        purchaseDate: new Date(),
        expiryDate: received.expiryDate,
        costPrice: poItem.unitPrice,
        mrp: received.mrp,
        supplier: po.supplier._id,
        purchaseOrderRef: po._id,
        storageLocation: received.storageLocation,
        hsnCode: received.hsnCode,
        status: 'active'
      });

      // Update product stock using InventoryManager (adds to embedded batch for backward compat)
      await InventoryManager.addStock(received.productId, {
        batchNumber,
        quantity: qty,
        purchaseDate: new Date(),
        expiryDate: received.expiryDate,
        costPrice: poItem.unitPrice,
        supplier: po.supplier.name
      });

      batchesCreated.push(batch);
    }

    // Determine overall PO status
    const allReceived = po.items.every(item => item.receivedQuantity >= item.quantity);
    const anyReceived = po.items.some(item => item.receivedQuantity > 0);
    po.status = allReceived ? 'received' : anyReceived ? 'partially_received' : po.status;
    if (allReceived) po.actualDeliveryDate = new Date();
    await po.save();

    res.json({ message: 'Goods received and inventory updated', po, batchesCreated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel PO
router.put('/:id/cancel', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!po) return res.status(404).json({ message: 'PO not found' });
    res.json({ message: 'Purchase order cancelled', po });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
