const mongoose = require('mongoose');
const Product = require('../models/Product');
const StockReservation = require('../models/StockReservation');

/**
 * Stock Reservation System
 * Prevents overselling by locking inventory during active checkout sessions.
 * Works on top of the existing FIFO/FEFO InventoryManager.
 */
class StockReservationService {
  /**
   * Reserve stock for a checkout session.
   * Uses a MongoDB transaction to atomically check + reserve.
   */
  static async reserve(userId, sessionId, items) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const reservationItems = [];

      for (const { productId, quantity } of items) {
        const product = await Product.findById(productId).session(session);

        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        // Calculate already-reserved quantity for this product by OTHER sessions
        const existingReservations = await StockReservation.aggregate([
          {
            $match: {
              'items.product': new mongoose.Types.ObjectId(productId),
              status: 'active',
              user: { $ne: new mongoose.Types.ObjectId(userId) }
            }
          },
          { $unwind: '$items' },
          { $match: { 'items.product': new mongoose.Types.ObjectId(productId) } },
          { $group: { _id: null, total: { $sum: '$items.quantity' } } }
        ]);

        const alreadyReserved = existingReservations[0]?.total || 0;
        const availableStock = product.stock - alreadyReserved;

        if (availableStock < quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${quantity}`
          );
        }

        reservationItems.push({ product: productId, quantity, reservedAt: new Date() });
      }

      // Release any existing active reservation for this user/session
      await StockReservation.updateMany(
        { user: userId, sessionId, status: 'active' },
        { status: 'released' },
        { session }
      );

      // Create new reservation (15 min TTL)
      const reservation = await StockReservation.create(
        [{
          user: userId,
          sessionId,
          items: reservationItems,
          status: 'active',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }],
        { session }
      );

      await session.commitTransaction();
      return reservation[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Convert reservation to confirmed sale after payment.
   * Call this instead of (or after) InventoryManager.deductStock.
   */
  static async convertToSale(userId, sessionId, orderId) {
    const reservation = await StockReservation.findOneAndUpdate(
      { user: userId, sessionId, status: 'active' },
      { status: 'converted', orderId },
      { new: true }
    );
    return reservation;
  }

  /**
   * Release a reservation (cart abandonment, payment failure).
   */
  static async release(userId, sessionId) {
    return StockReservation.updateMany(
      { user: userId, sessionId, status: 'active' },
      { status: 'released' }
    );
  }

  /**
   * Get available stock for a product (total stock minus active reservations).
   */
  static async getAvailableStock(productId) {
    const product = await Product.findById(productId).select('stock name');
    if (!product) return null;

    const reservations = await StockReservation.aggregate([
      { $match: { 'items.product': new mongoose.Types.ObjectId(productId), status: 'active' } },
      { $unwind: '$items' },
      { $match: { 'items.product': new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);

    const reserved = reservations[0]?.total || 0;
    return {
      productId,
      name: product.name,
      totalStock: product.stock,
      reserved,
      available: Math.max(0, product.stock - reserved)
    };
  }

  /**
   * Get active reservations summary (for admin inventory view).
   */
  static async getActiveReservations() {
    return StockReservation.find({ status: 'active' })
      .populate('user', 'name email')
      .populate('items.product', 'name stock')
      .sort({ createdAt: -1 });
  }
}

module.exports = StockReservationService;
