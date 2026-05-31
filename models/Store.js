const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['retail', 'warehouse', 'distribution_center'], default: 'retail' },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: { lat: Number, lng: Number }
  },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  inventory: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    minStock: Number,
    maxStock: Number,
    reorderPoint: Number
  }],
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  isActive: { type: Boolean, default: true },
  metrics: {
    totalSales: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 },
    customerCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

storeSchema.index({ code: 1 });
storeSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('Store', storeSchema);
