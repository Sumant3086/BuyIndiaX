const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  variant: {
    type: Map,
    of: String // e.g., { "Color": "Red", "Size": "M" }
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: String
  },
  paymentMethod: {
    type: String,
    required: true,
    default: 'Razorpay'
  },
  paymentResult: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    transactionId: String,
    paymentMethod: String
  },
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: String,
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded', 'Return Requested', 'Return Approved'],
    default: 'Pending'
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  shippedAt: Date,
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  cancellationReason: String,
  cancelledAt: Date,
  refundAmount: Number,
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'processed', 'failed'],
    default: 'none'
  },
  // Return request details
  returnRequest: {
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Rejected', 'Received', 'Completed']
    },
    reason: String,
    items: [mongoose.Schema.Types.ObjectId], // Item IDs being returned
    requestedAt: Date,
    approvedAt: Date,
    refundMethod: {
      type: String,
      enum: ['original_payment', 'store_credit', 'exchange']
    }
  },
  // Refund details
  refund: {
    amount: Number,
    method: String,
    processedAt: Date,
    status: String
  },
  giftWrap: {
    type: Boolean,
    default: false
  },
  giftMessage: String,
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ isPaid: 1 });
orderSchema.index({ createdAt: -1 }); // For date range queries
orderSchema.index({ 'items.product': 1 }); // For product-based queries

module.exports = mongoose.model('Order', orderSchema);
