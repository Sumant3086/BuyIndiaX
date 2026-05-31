const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const InventoryBatch = require('../models/InventoryBatch');
const StockReservation = require('../models/StockReservation');
const InventoryManager = require('../utils/inventoryManager');
const BarcodeService = require('../utils/barcodeService');
const { auth, requirePermission } = require('../middleware/auth');
const { cache } = require('../middleware/cache');

// Add inventory batch
router.post('/batch/add', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { productId, batchData } = req.body;
    if (!productId || !batchData?.quantity) {
      return res.status(400).json({ message: 'productId and batchData.quantity are required' });
    }

    const result = await InventoryManager.addStock(productId, batchData);
    res.json({ message: 'Batch added successfully', ...result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get low stock products
router.get('/low-stock', auth, requirePermission('view_inventory'), cache(120), async (req, res) => {
  try {
    const products = await InventoryManager.getLowStockProducts();
    res.json({ count: products.length, products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get expired inventory
router.get('/expired', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const expiredItems = await InventoryManager.checkExpiredInventory();
    res.json({ count: expiredItems.length, expiredItems });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get inventory valuation
router.get('/valuation', auth, requirePermission('view_analytics'), cache(300), async (req, res) => {
  try {
    const valuation = await InventoryManager.getInventoryValuation();
    res.json(valuation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product inventory details (with batches from both sources)
router.get('/product/:productId', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const [product, batches, reservation] = await Promise.all([
      Product.findById(req.params.productId)
        .select('name stock lowStockThreshold inventoryBatches inventoryMethod barcode category hsnCode'),
      InventoryBatch.find({ product: req.params.productId, status: 'active' })
        .populate('warehouse', 'name code')
        .populate('supplier', 'name')
        .sort({ expiryDate: 1 }),
      StockReservation.aggregate([
        { $match: { 'items.product': require('mongoose').Types.ObjectId(req.params.productId), status: 'active' } },
        { $unwind: '$items' },
        { $match: { 'items.product': require('mongoose').Types.ObjectId(req.params.productId) } },
        { $group: { _id: null, reserved: { $sum: '$items.quantity' } } }
      ])
    ]);

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({
      product,
      dedicatedBatches: batches,
      reserved: reservation[0]?.reserved || 0,
      availableStock: product.stock - (reservation[0]?.reserved || 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update inventory method
router.put('/product/:productId/method', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const { inventoryMethod } = req.body;
    if (!['FIFO', 'FEFO', 'LIFO'].includes(inventoryMethod)) {
      return res.status(400).json({ message: 'Invalid method. Use: FIFO, FEFO, or LIFO' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { inventoryMethod },
      { new: true }
    ).select('name inventoryMethod');

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Inventory method updated', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Barcode Operations ────────────────────────────────────────────────────────

// Generate barcode for a product (or return existing)
router.post('/barcode/generate/:productId', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select('_id name barcode category brand');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.barcode) {
      const info = BarcodeService.identify(product.barcode);
      return res.json({ barcode: product.barcode, isNew: false, type: info.type, sku: null });
    }

    const categoryShort = (product.category || 'GEN').slice(0, 2).toUpperCase();
    const barcode = BarcodeService.generateEAN13(product._id, categoryShort);
    const sku = BarcodeService.generateSKU(product.name, product.category, product.brand);
    const qrPayload = BarcodeService.generateQRPayload(product);

    await Product.findByIdAndUpdate(product._id, { barcode });

    res.json({ barcode, sku, qrPayload, isNew: true, type: 'EAN-13', isValid: BarcodeService.validateEAN13(barcode) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate a barcode
router.get('/barcode/validate/:barcode', auth, async (req, res) => {
  try {
    const { barcode } = req.params;
    const info = BarcodeService.identify(barcode);

    // Check if barcode exists in our system
    const product = await Product.findOne({ barcode }).select('name category price stock');

    res.json({ barcode, ...info, product: product || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Batch-assign missing barcodes to all products
router.post('/barcode/assign-missing', auth, requirePermission('manage_inventory'), async (req, res) => {
  try {
    const assigned = await BarcodeService.assignMissingBarcodes(Product);
    res.json({ message: `Assigned barcodes to ${assigned.length} products`, assigned });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Lookup product by barcode
router.get('/barcode/lookup/:barcode', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode })
      .select('name price originalPrice discount stock category barcode brand unit');

    if (!product) return res.status(404).json({ message: 'Product not found for barcode: ' + req.params.barcode });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Active stock reservations (admin view)
router.get('/reservations/active', auth, requirePermission('view_inventory'), async (req, res) => {
  try {
    const StockReservationService = require('../utils/stockReservation');
    const reservations = await StockReservationService.getActiveReservations();
    res.json({ count: reservations.length, reservations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
