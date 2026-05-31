const mongoose = require('mongoose');

const storeTransferSchema = new mongoose.Schema({
  transferNumber: { type: String, required: true, unique: true },
  fromStore: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  toStore: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    batchNumber: String
  }],
  status: { type: String, enum: ['pending', 'in_transit', 'completed', 'cancelled'], default: 'pending' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shippedAt: Date,
  receivedAt: Date,
  notes: String
}, { timestamps: true });

storeTransferSchema.index({ transferNumber: 1 });
storeTransferSchema.index({ fromStore: 1, toStore: 1, status: 1 });

module.exports = mongoose.model('StoreTransfer', storeTransferSchema);
