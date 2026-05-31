const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  rmaNumber: { type: String, required: true, unique: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    reason: { type: String, enum: ['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other'] },
    condition: { type: String, enum: ['unopened', 'opened', 'damaged'] },
    refundAmount: Number
  }],
  totalRefundAmount: Number,
  status: { type: String, enum: ['requested', 'approved', 'rejected', 'received', 'inspected', 'refunded', 'restocked'], default: 'requested' },
  refundMethod: { type: String, enum: ['original_payment', 'store_credit', 'exchange'] },
  requestDate: { type: Date, default: Date.now },
  approvedDate: Date,
  receivedDate: Date,
  refundedDate: Date,
  restockedDate: Date,
  notes: String,
  inspectionNotes: String,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

returnSchema.index({ rmaNumber: 1 });
returnSchema.index({ customer: 1, status: 1 });

module.exports = mongoose.model('Return', returnSchema);
