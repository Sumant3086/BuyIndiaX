const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: ['view', 'search', 'add_to_cart', 'wishlist', 'purchase', 'review', 'click', 'checkout_start', 'checkout_abandon'],
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  searchQuery: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  sessionId: String,
  ipAddress: String,
  userAgent: String,
  // CTR and Conversion Tracking
  clickSource: String, // 'recommendation', 'search', 'category', 'home'
  wasRecommendation: Boolean,
  checkoutStep: Number, // 1: started, 2: shipping, 3: payment, 4: completed
  cartValue: Number,
  timeSpent: Number // seconds
}, {
  timestamps: true
});

// Index for analytics queries
userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ product: 1, activityType: 1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
