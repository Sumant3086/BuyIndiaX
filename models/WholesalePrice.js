const mongoose = require('mongoose');

const wholesalePriceSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  tier: {
    type: String,
    enum: ['Standard', 'Silver', 'Gold', 'Platinum'],
    required: true
  },
  minimumQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
wholesalePriceSchema.index({ product: 1, tier: 1, minimumQuantity: 1 });

// Get applicable price for quantity and tier
wholesalePriceSchema.statics.getPrice = async function(productId, quantity, tier = 'Standard') {
  const now = new Date();
  
  const prices = await this.find({
    product: productId,
    tier: tier,
    minimumQuantity: { $lte: quantity },
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: { $gte: now } }
    ]
  }).sort({ minimumQuantity: -1 }).limit(1);
  
  return prices.length > 0 ? prices[0] : null;
};

module.exports = mongoose.model('WholesalePrice', wholesalePriceSchema);
