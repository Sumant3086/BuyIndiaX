const Cart = require('../models/Cart');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const { sendAbandonedCartEmail } = require('./emailService');

class CartAbandonmentTracker {
  // Track cart abandonment and send recovery emails
  static async checkAbandonedCarts() {
    try {
      const abandonmentThreshold = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();

      // Find carts with items that haven't been updated in 24 hours
      const abandonedCarts = await Cart.find({
        'items.0': { $exists: true }, // Has at least one item
        updatedAt: { $lt: new Date(now - abandonmentThreshold) }
      }).populate('user items.product');

      const results = [];

      for (const cart of abandonedCarts) {
        // Check if user has already received abandonment email recently
        const recentActivity = await UserActivity.findOne({
          user: cart.user._id,
          activityType: 'cart_abandonment_email',
          timestamp: { $gt: new Date(now - abandonmentThreshold) }
        });

        if (!recentActivity && cart.user.email) {
          // Send abandonment email
          await sendAbandonedCartEmail(cart.user, cart);

          // Log activity
          await UserActivity.create({
            user: cart.user._id,
            activityType: 'cart_abandonment_email',
            metadata: {
              cartValue: cart.totalAmount,
              itemCount: cart.items.length
            }
          });

          results.push({
            userId: cart.user._id,
            email: cart.user.email,
            cartValue: cart.totalAmount,
            status: 'email_sent'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Cart abandonment check error:', error);
      throw error;
    }
  }

  // Calculate cart abandonment rate
  static async getAbandonmentRate(days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Carts created in period
      const totalCarts = await Cart.countDocuments({
        'items.0': { $exists: true },
        createdAt: { $gte: startDate }
      });

      // Orders completed in period
      const Order = require('../models/Order');
      const completedOrders = await Order.countDocuments({
        createdAt: { $gte: startDate },
        isPaid: true
      });

      const abandonmentRate = totalCarts > 0 
        ? ((totalCarts - completedOrders) / totalCarts) * 100 
        : 0;

      return {
        totalCarts,
        completedOrders,
        abandonedCarts: totalCarts - completedOrders,
        abandonmentRate: Math.round(abandonmentRate * 100) / 100
      };
    } catch (error) {
      console.error('Abandonment rate calculation error:', error);
      throw error;
    }
  }

  // Get cart recovery metrics
  static async getRecoveryMetrics(days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Emails sent
      const emailsSent = await UserActivity.countDocuments({
        activityType: 'cart_abandonment_email',
        timestamp: { $gte: startDate }
      });

      // Recovered carts (orders placed after abandonment email)
      const recoveredCarts = await UserActivity.aggregate([
        {
          $match: {
            activityType: 'cart_abandonment_email',
            timestamp: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'orders',
            let: { userId: '$user', emailTime: '$timestamp' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user', '$$userId'] },
                      { $gte: ['$createdAt', '$$emailTime'] },
                      { $lte: ['$createdAt', { $add: ['$$emailTime', 48 * 60 * 60 * 1000] }] }
                    ]
                  }
                }
              }
            ],
            as: 'orders'
          }
        },
        {
          $match: { 'orders.0': { $exists: true } }
        },
        {
          $count: 'recovered'
        }
      ]);

      const recovered = recoveredCarts[0]?.recovered || 0;
      const recoveryRate = emailsSent > 0 ? (recovered / emailsSent) * 100 : 0;

      return {
        emailsSent,
        cartsRecovered: recovered,
        recoveryRate: Math.round(recoveryRate * 100) / 100
      };
    } catch (error) {
      console.error('Recovery metrics error:', error);
      throw error;
    }
  }
}

module.exports = CartAbandonmentTracker;
