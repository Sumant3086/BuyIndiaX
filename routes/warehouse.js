const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Warehouse = require('../models/Warehouse');
const InventoryBatch = require('../models/InventoryBatch');
const Product = require('../models/Product');
const { auth, requirePermission, requireRole } = require('../middleware/auth');

// List all warehouses
router.get('/', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true })
      .populate('manager', 'name email')
      .sort({ isPrimary: -1, name: 1 });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get warehouse details with inventory summary
router.get('/:id', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate('manager staff', 'name email');
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });

    const inventorySummary = await InventoryBatch.aggregate([
      { $match: { warehouse: warehouse._id, status: 'active' } },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          batchCount: { $sum: 1 },
          earliestExpiry: { $min: '$expiryDate' }
        }
      },
      {
        $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          category: '$product.category',
          totalQuantity: 1,
          totalValue: 1,
          batchCount: 1,
          earliestExpiry: 1
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({ warehouse, inventorySummary });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create warehouse
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ message: 'Warehouse created', warehouse });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Warehouse code already exists' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update warehouse
router.put('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    res.json({ message: 'Warehouse updated', warehouse });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get expiring batches across a warehouse (FEFO alert)
router.get('/:id/expiring', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);

    const expiring = await InventoryBatch.find({
      warehouse: req.params.id,
      status: 'active',
      expiryDate: { $lte: cutoffDate, $gte: new Date() }
    })
      .populate('product', 'name category barcode')
      .populate('supplier', 'name')
      .sort({ expiryDate: 1 });

    res.json({ count: expiring.length, batches: expiring });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get already-expired batches (need removal/disposal)
router.get('/:id/expired', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const expired = await InventoryBatch.find({
      warehouse: req.params.id,
      status: 'active',
      expiryDate: { $lt: new Date() }
    })
      .populate('product', 'name category')
      .sort({ expiryDate: 1 });

    res.json({ count: expired.length, batches: expired });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark batch as damaged/expired/quarantined
router.put('/batch/:batchId/status', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ['expired', 'damaged', 'quarantined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const batch = await InventoryBatch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    if (batch.status !== 'active') return res.status(400).json({ message: 'Batch is not active' });

    const prevQuantity = batch.quantity;
    batch.status = status;
    batch.notes = reason;
    batch.quantity = 0;
    await batch.save();

    // Reduce product stock accordingly
    await Product.findByIdAndUpdate(batch.product, { $inc: { stock: -prevQuantity } });

    res.json({ message: `Batch marked as ${status}. ${prevQuantity} units removed from stock.`, batch });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Warehouse-level inventory valuation report
router.get('/:id/valuation', auth, requirePermission('view_analytics'), async (req, res) => {
  try {
    const [valuation] = await InventoryBatch.aggregate([
      { $match: { warehouse: new mongoose.Types.ObjectId(req.params.id), status: 'active' } },
      {
        $group: {
          _id: null,
          totalCostValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          totalUnits: { $sum: '$quantity' },
          batchCount: { $sum: 1 }
        }
      }
    ]);

    res.json(valuation || { totalCostValue: 0, totalUnits: 0, batchCount: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
