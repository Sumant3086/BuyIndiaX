const mongoose = require('mongoose');
const crypto = require('crypto');

const webhookEndpointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  secret: { type: String, required: true },
  events: [{
    type: String,
    enum: [
      'order.created', 'order.paid', 'order.shipped', 'order.delivered', 'order.cancelled',
      'order.refunded', 'return.requested', 'return.approved', 'return.completed',
      'product.created', 'product.updated', 'product.low_stock', 'product.out_of_stock',
      'inventory.batch_added', 'inventory.expiring_soon',
      'payment.success', 'payment.failed',
      'pos.sale_completed', 'pos.session_closed',
      'user.registered', 'user.tier_upgraded'
    ]
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stats: {
    totalDeliveries: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    failedDeliveries: { type: Number, default: 0 },
    lastDeliveryAt: Date,
    lastStatus: Number
  }
}, { timestamps: true });

webhookEndpointSchema.pre('save', function (next) {
  if (!this.secret) {
    this.secret = crypto.randomBytes(32).toString('hex');
  }
  next();
});

webhookEndpointSchema.index({ isActive: 1, events: 1 });

module.exports = mongoose.model('WebhookEndpoint', webhookEndpointSchema);
