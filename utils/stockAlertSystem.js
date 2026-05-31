const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const User = require('../models/User');
const Notification = require('../models/Notification');

class StockAlertSystem {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  // Notify users when out-of-stock product is back in stock
  async notifyBackInStock(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product || product.stock === 0) return;

      // Find users who have this product in wishlist
      const wishlists = await Wishlist.find({
        'products.product': productId
      }).populate('user');

      const notifications = [];

      for (const wishlist of wishlists) {
        if (wishlist.user) {
          // Send notification
          if (this.notificationService) {
            await this.notificationService.sendToUser(wishlist.user._id, {
              type: 'stock_alert',
              title: 'Back in Stock!',
              message: `${product.name} is now available. Order now before it's gone!`,
              relatedId: productId
            });
          }

          notifications.push({
            userId: wishlist.user._id,
            productId,
            productName: product.name,
            status: 'notified'
          });
        }
      }

      return notifications;
    } catch (error) {
      console.error('Back in stock notification error:', error);
      throw error;
    }
  }

  // Register user for stock alert
  async registerStockAlert(userId, productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) throw new Error('Product not found');

      // Initialize stockAlerts array if it doesn't exist
      if (!product.stockAlerts) {
        product.stockAlerts = [];
      }

      // Check if user already registered
      const alreadyRegistered = product.stockAlerts.some(
        alert => alert.user.toString() === userId.toString()
      );

      if (!alreadyRegistered) {
        product.stockAlerts.push({
          user: userId,
          registeredAt: new Date()
        });
        await product.save();
      }

      return { message: 'Stock alert registered', product };
    } catch (error) {
      console.error('Stock alert registration error:', error);
      throw error;
    }
  }

  // Get products with low stock
  async getLowStockProducts(threshold = 10) {
    try {
      const products = await Product.find({
        stock: { $lte: threshold, $gt: 0 }
      }).select('name stock category price');

      return products;
    } catch (error) {
      console.error('Low stock products error:', error);
      throw error;
    }
  }

  // Get out of stock products with pending alerts
  async getOutOfStockWithAlerts() {
    try {
      const products = await Product.find({
        stock: 0,
        'stockAlerts.0': { $exists: true }
      }).select('name category stockAlerts');

      return products.map(p => ({
        productId: p._id,
        name: p.name,
        category: p.category,
        alertCount: p.stockAlerts.length
      }));
    } catch (error) {
      console.error('Out of stock with alerts error:', error);
      throw error;
    }
  }

  // Clear stock alerts after notification
  async clearStockAlerts(productId) {
    try {
      const product = await Product.findById(productId);
      if (product) {
        product.stockAlerts = [];
        await product.save();
      }
    } catch (error) {
      console.error('Clear stock alerts error:', error);
      throw error;
    }
  }
}

module.exports = StockAlertSystem;
