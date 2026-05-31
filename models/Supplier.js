const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  contactPerson: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  paymentTerms: { type: String, default: 'Net 30' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  metrics: {
    totalOrders: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    onTimeDeliveryRate: { type: Number, default: 100 },
    qualityScore: { type: Number, default: 100 }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

supplierSchema.index({ code: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
