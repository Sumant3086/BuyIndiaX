const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const { auth, requirePermission, requireRole } = require('../middleware/auth');

// List all suppliers
router.get('/', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const [suppliers, total] = await Promise.all([
      Supplier.find(query)
        .populate('products', 'name price category')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Supplier.countDocuments(query)
    ]);

    res.json({ suppliers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single supplier with performance metrics
router.get('/:id', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate('products', 'name price category stock');
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    // Recent purchase orders
    const recentPOs = await PurchaseOrder.find({ supplier: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('poNumber status totalAmount orderDate expectedDeliveryDate');

    res.json({ supplier, recentPOs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create supplier
router.post('/', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const code = req.body.code || `SUP${Date.now().toString().slice(-6)}`;
    const supplier = await Supplier.create({ ...req.body, code });
    res.status(201).json({ message: 'Supplier created', supplier });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Supplier code already exists' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update supplier
router.put('/:id', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier updated', supplier });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Deactivate supplier
router.delete('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deactivated', supplier });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update supplier performance metrics
router.put('/:id/metrics', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { onTimeDeliveryRate, qualityScore } = req.body;
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: { 'metrics.onTimeDeliveryRate': onTimeDeliveryRate, 'metrics.qualityScore': qualityScore } },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Metrics updated', supplier });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
