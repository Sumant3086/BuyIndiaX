const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    receivedQuantity: { type: Number, default: 0 }
  }],
  totalAmount: Number,
  status: { type: String, enum: ['draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'], default: 'draft' },
  orderDate: { type: Date, default: Date.now },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String
}, { timestamps: true });

purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplier: 1, status: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
