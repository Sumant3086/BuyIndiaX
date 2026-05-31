const mongoose = require('mongoose');

/**
 * GST Rate configuration per product category/HSN code.
 * Indian GST slabs: 0%, 5%, 12%, 18%, 28%
 */
const gstRateSchema = new mongoose.Schema({
  hsnCode: {
    type: String,
    trim: true,
    index: true
  },
  category: {
    type: String,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: String,
  cgstRate: {
    type: Number,
    required: true,
    min: 0,
    max: 14
  },
  sgstRate: {
    type: Number,
    required: true,
    min: 0,
    max: 14
  },
  igstRate: {
    type: Number,
    required: true,
    min: 0,
    max: 28
  },
  cessRate: {
    type: Number,
    default: 0
  },
  isExempt: {
    type: Boolean,
    default: false
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: Date,
  notes: String
}, { timestamps: true });

gstRateSchema.index({ category: 1 });
gstRateSchema.index({ hsnCode: 1 });

module.exports = mongoose.model('GSTRate', gstRateSchema);
