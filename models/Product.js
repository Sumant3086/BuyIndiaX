const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other']
  },
  brand: {
    type: String,
    default: 'Generic'
  },
  images: [{
    url: String,
    alt: String
  }],
  image: {
    type: String,
    default: 'https://via.placeholder.com/300'
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  originalPrice: {
    type: Number
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isFlashSale: {
    type: Boolean,
    default: false
  },
  flashSaleEndTime: {
    type: Date
  },
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  variants: [{
    name: String, // e.g., "Color", "Size"
    options: [String] // e.g., ["Red", "Blue"], ["S", "M", "L"]
  }],
  specifications: {
    type: Map,
    of: String
  },
  weight: Number, // in kg for shipping calculation
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  salesCount: {
    type: Number,
    default: 0
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for search optimization
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ views: -1 });
productSchema.index({ salesCount: -1 });

module.exports = mongoose.model('Product', productSchema);
