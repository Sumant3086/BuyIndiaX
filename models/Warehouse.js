const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: {
    type: String,
    enum: ['main_warehouse', 'dark_store', 'retail_store', 'distribution_center', 'cold_storage'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
    coordinates: { lat: Number, lng: Number }
  },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  capacity: {
    totalSlots: Number,
    usedSlots: { type: Number, default: 0 },
    unit: { type: String, default: 'pallets' }
  },
  storageZones: [{
    code: String,
    name: String,
    type: { type: String, enum: ['ambient', 'refrigerated', 'frozen', 'hazmat'] },
    temperature: { min: Number, max: Number },
    capacity: Number
  }],
  isActive: { type: Boolean, default: true },
  isPrimary: { type: Boolean, default: false },
  operatingHours: {
    monday: { open: String, close: String, isClosed: Boolean },
    tuesday: { open: String, close: String, isClosed: Boolean },
    wednesday: { open: String, close: String, isClosed: Boolean },
    thursday: { open: String, close: String, isClosed: Boolean },
    friday: { open: String, close: String, isClosed: Boolean },
    saturday: { open: String, close: String, isClosed: Boolean },
    sunday: { open: String, close: String, isClosed: Boolean }
  },
  gstNumber: String,
  contactPhone: String,
  contactEmail: String,
  metrics: {
    totalInbound: { type: Number, default: 0 },
    totalOutbound: { type: Number, default: 0 },
    lastAuditDate: Date,
    accuracyRate: { type: Number, default: 100 }
  }
}, { timestamps: true });

warehouseSchema.index({ code: 1 });
warehouseSchema.index({ type: 1, isActive: 1 });
warehouseSchema.index({ isPrimary: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
