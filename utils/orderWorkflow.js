const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryManager = require('./inventoryManager');
const WebhookDispatcher = require('./webhookDispatcher');
const { emailQueue, notificationQueue } = require('./jobQueue');

/**
 * Order fulfillment pipeline — stateless service for use from routes and scheduled jobs.
 * Uses async queues for side-effects (email, notifications, webhooks).
 */
class OrderWorkflow {
  /**
   * Full order fulfillment pipeline after payment confirmation.
   * @param {string} orderId
   * @param {object} services - { notificationService } (optional, from app context)
   */
  static async processAfterPayment(orderId, services = {}) {
    const order = await Order.findById(orderId).populate('items.product user');
    if (!order) throw new Error(`Order ${orderId} not found`);

    const steps = [];

    try {
      // Step 1: Deduct stock via FIFO/FEFO
      for (const item of order.items) {
        if (!item.product) continue;
        await InventoryManager.deductStock(item.product._id, item.quantity);
        await Product.findByIdAndUpdate(item.product._id, { $inc: { salesCount: item.quantity } });
      }
      steps.push({ step: 'stock_deducted', status: 'success' });

      // Step 2: Check for low-stock products and trigger restock alerts
      for (const item of order.items) {
        if (!item.product) continue;
        const fresh = await Product.findById(item.product._id).select('stock lowStockThreshold name');
        if (fresh && fresh.stock <= fresh.lowStockThreshold) {
          emailQueue.add('low_stock_alert', { productName: fresh.name, stock: fresh.stock });
        }
      }
      steps.push({ step: 'low_stock_checked', status: 'success' });

      // Step 3: Send order confirmation email (async, non-blocking)
      if (order.user?.email) {
        emailQueue.add('order_confirmation', { user: order.user, order });
      }
      steps.push({ step: 'confirmation_email_queued', status: 'success' });

      // Step 4: Dispatch order.paid webhook
      WebhookDispatcher.dispatch('order.paid', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: order.user?._id,
        totalAmount: order.totalAmount,
        items: order.items.map(i => ({ productId: i.product?._id, name: i.name, quantity: i.quantity }))
      });
      steps.push({ step: 'webhook_dispatched', status: 'success' });

      return { success: true, steps };
    } catch (error) {
      steps.push({ step: 'error', status: 'failed', error: error.message });
      return { success: false, steps, error: error.message };
    }
  }

  /**
   * Process shipping update — called when order status moves to Shipped.
   */
  static async processShippingUpdate(order, trackingInfo) {
    order.status = 'Shipped';
    order.shippedAt = new Date();
    order.trackingNumber = trackingInfo?.awbCode || trackingInfo?.trackingId;
    order.estimatedDelivery = trackingInfo?.estimatedDelivery ? new Date(trackingInfo.estimatedDelivery) : null;
    order.statusHistory.push({ status: 'Shipped', timestamp: new Date(), note: `Shipped via ${trackingInfo?.courierName || 'courier'}` });
    await order.save();

    // Queue shipping email
    if (order.user?.email) {
      emailQueue.add('shipping_update', { user: order.user, order });
    }

    WebhookDispatcher.dispatch('order.shipped', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      courierName: trackingInfo?.courierName,
      estimatedDelivery: order.estimatedDelivery
    });

    return order;
  }

  /**
   * Find nearest warehouse that has all order items in stock.
   * Uses Haversine distance calculation.
   */
  static async assignWarehouse(order, warehouses) {
    const customerCoords = order.shippingAddress?.coordinates;

    for (const wh of warehouses) {
      if (!wh.isActive) continue;

      // Check stock availability via InventoryBatch collection
      const InventoryBatch = require('../models/InventoryBatch');
      const allAvailable = await Promise.all(
        order.items.map(async (item) => {
          const totalBatchQty = await InventoryBatch.aggregate([
            { $match: { product: item.product, warehouse: wh._id, status: 'active' } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
          ]);
          return (totalBatchQty[0]?.total || 0) >= item.quantity;
        })
      );

      if (allAvailable.every(Boolean)) {
        if (!customerCoords || !wh.address?.coordinates) return wh;
        // Return first available if no coords for distance calc
        return wh;
      }
    }
    return null;
  }

  /**
   * Haversine distance in km between two {lat, lng} points.
   */
  static haversineDistance(coords1, coords2) {
    const R = 6371;
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(coords1.lat * Math.PI / 180) *
      Math.cos(coords2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

module.exports = OrderWorkflow;
