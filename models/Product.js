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
    enum: [
      'Fresh Produce',
      'Grocery', 
      'Beverages',
      'Health & Beauty',
      'Non-Food Items'
    ]
  },
  subcategory: {
    type: String,
    enum: [
      // Fresh Produce
      'Vegetables', 'Fruits', 'Meat', 'Halal Meat', 'Fish & Seafood', 'Dairy', 'Bakery',
      // Grocery
      'Staples', 'Pasta & Noodles', 'Canned Goods', 'Sauces & Condiments', 'Snacks', 'Baby Food',
      // Beverages
      'Soft Drinks', 'Juices & Water', 'Energy Drinks', 'Alcoholic Beverages', 'Tea & Coffee',
      // Health & Beauty
      'Skincare', 'Hair Care', 'Bath & Body', 'Oral Care', 'Fragrances', 'Cosmetics', 'Healthcare',
      // Non-Food Items
      'Cleaning Products', 'Kitchenware', 'Stationery', 'Electronics', 'Clothing & Textiles'
    ]
  },
  brand: {
    type: String,
    default: 'Generic'
  },
  // Supermarket specific fields
  unit: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'pack', 'dozen', 'bundle'],
    default: 'piece'
  },
  unitQuantity: {
    type: Number,
    default: 1
  },
  isPerishable: {
    type: Boolean,
    default: false
  },
  shelfLife: {
    type: Number, // days
    default: null
  },
  storageCondition: {
    type: String,
    enum: ['Ambient', 'Refrigerated', 'Frozen'],
    default: 'Ambient'
  },
  isHalalCertified: {
    type: Boolean,
    default: false
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  countryOfOrigin: {
    type: String,
    default: 'India'
  },
  hsnCode: {
    type: String,
    trim: true
  },
  gstRate: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 }
  },
  trendingScore: {
    type: Number,
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
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
  // FIFO/FEFO Inventory Management
  inventoryBatches: [{
    batchNumber: String,
    quantity: Number,
    purchaseDate: Date,
    expiryDate: Date,
    costPrice: Number,
    supplier: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inventoryMethod: {
    type: String,
    enum: ['FIFO', 'FEFO', 'LIFO'],
    default: 'FIFO'
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
  },
  // Price history for price drop monitoring
  priceHistory: [{
    price: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Stock alert registrations
  stockAlerts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Text search index with field weights
productSchema.index(
  { name: 'text', description: 'text', tags: 'text', brand: 'text' },
  { weights: { name: 10, tags: 5, brand: 3, description: 1 }, name: 'product_text_search' }
);
productSchema.index({ category: 1, subcategory: 1, price: 1 });
productSchema.index({ category: 1, stock: 1 });
productSchema.index({ rating: -1, numReviews: -1 });
productSchema.index({ trendingScore: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ stock: 1, lowStockThreshold: 1 });
productSchema.index({ 'inventoryBatches.expiryDate': 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ discount: -1, stock: 1 });
productSchema.index({ isFlashSale: 1, flashSaleEndTime: 1 });
productSchema.index({ isFeatured: 1, stock: 1 });
productSchema.index({ brand: 1, category: 1 });

module.exports = mongoose.model('Product', productSchema);
