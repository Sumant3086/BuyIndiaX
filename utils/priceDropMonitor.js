const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const User = require('../models/User');
const { sendPriceDropAlert } = require('./emailService');

class PriceDropMonitor {
  // Monitor price changes and alert wishlist users
  static async checkPriceDrops() {
    try {
      const results = [];

      // Get all products that have price history
      const products = await Product.find({
        'priceHistory.0': { $exists: true }
      });

      for (const product of products) {
        const priceHistory = product.priceHistory || [];
        if (priceHistory.length < 2) continue;

        // Get last two prices
        const currentPrice = priceHistory[priceHistory.length - 1];
        const previousPrice = priceHistory[priceHistory.length - 2];

        // Check if price dropped by at least 5%
        const dropPercentage = ((previousPrice.price - currentPrice.price) / previousPrice.price) * 100;

        if (dropPercentage >= 5) {
          // Find users who have this product in wishlist
          const wishlists = await Wishlist.find({
            'products.product': product._id
          }).populate('user');

          for (const wishlist of wishlists) {
            if (wishlist.user && wishlist.user.email) {
              // Send price drop alert
              await sendPriceDropAlert(
                wishlist.user,
                product,
                previousPrice.price,
                currentPrice.price
              );

              results.push({
                userId: wishlist.user._id,
                productId: product._id,
                productName: product.name,
                oldPrice: previousPrice.price,
                newPrice: currentPrice.price,
                dropPercentage: Math.round(dropPercentage * 100) / 100,
                status: 'alert_sent'
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Price drop monitoring error:', error);
      throw error;
    }
  }

  // Track price history for a product
  static async updatePriceHistory(productId, newPrice) {
    try {
      const product = await Product.findById(productId);
      if (!product) throw new Error('Product not found');

      // Initialize priceHistory if it doesn't exist
      if (!product.priceHistory) {
        product.priceHistory = [];
      }

      // Check if price actually changed
      const lastPrice = product.priceHistory[product.priceHistory.length - 1];
      if (!lastPrice || lastPrice.price !== newPrice) {
        product.priceHistory.push({
          price: newPrice,
          date: new Date()
        });

        // Keep only last 30 price points
        if (product.priceHistory.length > 30) {
          product.priceHistory = product.priceHistory.slice(-30);
        }

        await product.save();
      }

      return product;
    } catch (error) {
      console.error('Price history update error:', error);
      throw error;
    }
  }

  // Get price trend for a product
  static async getPriceTrend(productId, days = 30) {
    try {
      const product = await Product.findById(productId);
      if (!product) throw new Error('Product not found');

      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const priceHistory = (product.priceHistory || []).filter(
        entry => new Date(entry.date) >= startDate
      );

      if (priceHistory.length === 0) {
        return { trend: 'stable', change: 0, history: [] };
      }

      const firstPrice = priceHistory[0].price;
      const lastPrice = priceHistory[priceHistory.length - 1].price;
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;

      let trend = 'stable';
      if (change > 5) trend = 'increasing';
      else if (change < -5) trend = 'decreasing';

      return {
        trend,
        change: Math.round(change * 100) / 100,
        history: priceHistory,
        lowestPrice: Math.min(...priceHistory.map(p => p.price)),
        highestPrice: Math.max(...priceHistory.map(p => p.price))
      };
    } catch (error) {
      console.error('Price trend error:', error);
      throw error;
    }
  }
}

module.exports = PriceDropMonitor;
