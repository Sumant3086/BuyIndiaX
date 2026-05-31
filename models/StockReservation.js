const mongoose = require('mongoose');

/**
 * StockReservation — holds inventory during active checkout sessions.
 * Reservations expire automatically via MongoDB TTL index.
 * On payment success: convert to deduction and delete reservation.
 * On expiry/abandon: TTL deletes it, stock is freed automatically.
 */
const stockReservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    reservedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['active', 'converted', 'expired', 'released'],
    default: 'active'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  }
}, { timestamps: true });

// TTL index: MongoDB will auto-delete documents after expiresAt
stockReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
stockReservationSchema.index({ user: 1, status: 1 });
stockReservationSchema.index({ sessionId: 1 });
stockReservationSchema.index({ orderId: 1 });

module.exports = mongoose.model('StockReservation', stockReservationSchema);
