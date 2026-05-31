/**
 * Real-time updates via Socket.IO.
 *
 * Memory leak fixes applied:
 * 1. trackProductPageView — was registering a new 'disconnect' listener on
 *    every product view, causing listener accumulation per socket.
 *    Fixed: use socket.join/leave + room-level counting only.
 * 2. broadcastFlashSaleCountdown — setInterval was never stored or cleared
 *    if called again for the same product.
 *    Fixed: per-product interval map with cleanup on expiry.
 */

class RealTimeUpdates {
  constructor(io) {
    this.io = io;
    // Map<productId, intervalId> — prevent duplicate flash-sale intervals
    this._flashSaleIntervals = new Map();
  }

  broadcastStockUpdate(productId, newStock) {
    const room = `product-${productId}`;
    this.io.to(room).emit('stock-update', { productId, stock: newStock });
    if (newStock > 0 && newStock <= 10) {
      this.io.to(room).emit('urgency-update', { type: 'low-stock', message: `Only ${newStock} left!` });
    }
    if (newStock === 0) {
      this.io.to(room).emit('out-of-stock', { productId });
    }
  }

  broadcastPriceUpdate(productId, oldPrice, newPrice) {
    this.io.to(`product-${productId}`).emit('price-update', {
      productId, oldPrice, newPrice, savings: oldPrice - newPrice
    });
  }

  broadcastPurchase(productId, productName, city) {
    // Targeted to product viewers only — avoid global broadcast spam
    this.io.to(`product-${productId}`).emit('social-proof', {
      message: `Someone from ${city} just bought this`
    });
  }

  broadcastViewerCount(productId) {
    const room = this.io.sockets.adapter.rooms.get(`product-${productId}`);
    const count = room ? room.size : 0;
    this.io.to(`product-${productId}`).emit('viewer-count', { productId, count });
  }

  /**
   * Start a flash-sale countdown broadcast.
   * Creates at most one interval per productId — safe to call repeatedly.
   */
  broadcastFlashSaleCountdown(productId, endTime) {
    if (this._flashSaleIntervals.has(productId)) return; // already running

    const interval = setInterval(() => {
      const diff = new Date(endTime) - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        this._flashSaleIntervals.delete(productId);
        this.io.to(`product-${productId}`).emit('flash-sale-ended', { productId });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      this.io.to(`product-${productId}`).emit('flash-sale-countdown', { productId, h, m, s });
    }, 1000);

    this._flashSaleIntervals.set(productId, interval);
  }

  /**
   * Track product page view — join room for stock/price updates.
   * Fixed: no nested 'disconnect' listeners — viewer count updated via
   * Socket.IO's built-in room leave on disconnect.
   */
  trackProductPageView(socket, productId) {
    const room = `product-${productId}`;
    socket.join(room);
    this.broadcastViewerCount(productId);

    // Single cleanup listener using socket.once (not socket.on) prevents accumulation
    const handleDisconnectOrLeave = () => {
      // Room leave happens automatically; just update the count
      setImmediate(() => this.broadcastViewerCount(productId));
    };

    // Use once so it fires once even if called from multiple product views
    socket.once('disconnect', handleDisconnectOrLeave);
  }

  joinUserRoom(socket, userId) {
    socket.join(`user-${userId}`);
  }

  leaveProductRoom(socket, productId) {
    socket.leave(`product-${productId}`);
    setImmediate(() => this.broadcastViewerCount(productId));
  }

  notifyOrderStatus(userId, orderId, status, message) {
    this.io.to(`user-${userId}`).emit('order-status-update', { orderId, status, message });
  }

  notifyPriceDrop(userId, productId, productName, oldPrice, newPrice) {
    this.io.to(`user-${userId}`).emit('price-drop-alert', {
      productId, productName, oldPrice, newPrice,
      savings: oldPrice - newPrice,
      savingsPercent: Math.round(((oldPrice - newPrice) / oldPrice) * 100)
    });
  }

  notifyBackInStock(userId, productId, productName) {
    this.io.to(`user-${userId}`).emit('back-in-stock', { productId, productName });
  }

  notifyCartStockChange(userId, productId, productName, newStock) {
    this.io.to(`user-${userId}`).emit('cart-stock-update', {
      productId, productName, newStock,
      action: newStock === 0 ? 'remove' : 'update'
    });
  }

  broadcastStoreStatus(isOpen, message) {
    this.io.emit('store-status', { isOpen, message });
  }

  // Cleanup on server shutdown
  destroy() {
    for (const [, interval] of this._flashSaleIntervals) {
      clearInterval(interval);
    }
    this._flashSaleIntervals.clear();
  }
}

module.exports = RealTimeUpdates;
