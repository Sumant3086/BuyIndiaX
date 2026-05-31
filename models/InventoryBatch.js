const mongoose = require('mongoose');

/**
 * InventoryBatch — separate collection for FIFO/FEFO batch tracking.
 * Extracted from Product.inventoryBatches embedded array to allow:
 * - Efficient batch-level analytics
 * - Atomic multi-product batch operations
 * - Compound queries without loading full product documents
 */
const inventoryBatchSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  originalQuantity: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    index: true
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: {
    type: Number,
    min: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  purchaseOrderRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  storageLocation: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'exhausted', 'expired', 'quarantined', 'damaged'],
    default: 'active'
  },
  hsnCode: {
    type: String,
    trim: true
  },
  notes: String
}, { timestamps: true });

// Compound indexes for FIFO/FEFO queries
inventoryBatchSchema.index({ product: 1, status: 1, purchaseDate: 1 });
inventoryBatchSchema.index({ product: 1, status: 1, expiryDate: 1 });
inventoryBatchSchema.index({ product: 1, warehouse: 1, status: 1 });
inventoryBatchSchema.index({ expiryDate: 1, status: 1 });
inventoryBatchSchema.index({ batchNumber: 1, product: 1 }, { unique: true });

// Virtual: days until expiry
inventoryBatchSchema.virtual('daysToExpiry').get(function () {
  if (!this.expiryDate) return null;
  return Math.ceil((this.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Auto-mark exhausted
inventoryBatchSchema.pre('save', function (next) {
  if (this.quantity === 0 && this.status === 'active') {
    this.status = 'exhausted';
  }
  next();
});

module.exports = mongoose.model('InventoryBatch', inventoryBatchSchema);
