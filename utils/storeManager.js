const Product = require('../models/Product');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

/**
 * Store Manager System for BuyIndiaX
 * Handles all store operations, inventory sync, and reporting
 */
class StoreManager {
  constructor() {
    this.storeHours = {
      opening: '08:00',
      closing: '22:00',
      timezone: 'Asia/Kolkata'
    };
  }

  // ========== STORE OPERATIONS ==========

  /**
   * Check if store is currently open
   */
  isStoreOpen() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [openHour, openMinute] = this.storeHours.opening.split(':').map(Number);
    const [closeHour, closeMinute] = this.storeHours.closing.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    return currentTime >= openTime && currentTime < closeTime;
  }

  /**
   * Get store status with timing
   */
  getStoreStatus() {
    const isOpen = this.isStoreOpen();
    const now = new Date();
    
    return {
      isOpen,
      currentTime: now.toLocaleTimeString('en-IN', { timeZone: this.storeHours.timezone }),
      openingTime: this.storeHours.opening,
      closingTime: this.storeHours.closing,
      message: isOpen 
        ? `Store is open until ${this.storeHours.closing}` 
        : `Store is closed. Opens at ${this.storeHours.opening}`
    };
  }

  // ========== PRODUCT MANAGEMENT ==========

  /**
   * Sync online and offline inventory
   */
  async syncInventory() {
    try {
      const products = await Product.find({});
      const syncReport = {
        totalProducts: products.length,
        inStock: 0,
        outOfStock: 0,
        lowStock: 0,
        expiringSoon: [],
        updated: []
      };

      for (const product of products) {
        // Check stock levels
        if (product.stock === 0) {
          syncReport.outOfStock++;
        } else if (product.stock <= product.lowStockThreshold) {
          syncReport.lowStock++;
        } else {
          syncReport.inStock++;
        }

        // Check expiry for perishables
        if (product.isPerishable && product.inventoryBatches) {
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

          for (const batch of product.inventoryBatches) {
            if (batch.expiryDate && new Date(batch.expiryDate) <= sevenDaysFromNow) {
              syncReport.expiringSoon.push({
                productId: product._id,
                productName: product.name,
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
              });
            }
          }
        }
      }

      // Log sync activity
      await AuditLog.create({
        action: 'inventory_sync',
        entity: 'system',
        changes: syncReport,
        ipAddress: 'system',
        userAgent: 'StoreManager'
      });

      return syncReport;
    } catch (error) {
      console.error('Inventory sync error:', error);
      throw error;
    }
  }

  /**
   * Update product availability (mark out of stock)
   */
  async updateProductAvailability(productId, isAvailable) {
    try {
      const product = await Product.findById(productId);
      if (!product) throw new Error('Product not found');

      const oldStock = product.stock;
      
      if (!isAvailable) {
        product.stock = 0;
      }

      await product.save();

      await AuditLog.create({
        action: 'product_availability_update',
        entity: 'product',
        entityId: productId,
        changes: {
          before: { stock: oldStock, available: oldStock > 0 },
          after: { stock: product.stock, available: isAvailable }
        }
      });

      return product;
    } catch (error) {
      console.error('Product availability update error:', error);
      throw error;
    }
  }

  /**
   * Bulk update product prices (for promotions)
   */
  async bulkUpdatePrices(updates) {
    try {
      const results = [];

      for (const update of updates) {
        const product = await Product.findById(update.productId);
        if (!product) continue;

        const oldPrice = product.price;
        product.price = update.newPrice;
        
        if (update.discount) {
          product.discount = update.discount;
          product.originalPrice = oldPrice;
        }

        await product.save();

        // Track price history
        if (!product.priceHistory) product.priceHistory = [];
        product.priceHistory.push({
          price: update.newPrice,
          date: new Date()
        });

        results.push({
          productId: product._id,
          productName: product.name,
          oldPrice,
          newPrice: update.newPrice,
          discount: update.discount
        });
      }

      await AuditLog.create({
        action: 'bulk_price_update',
        entity: 'product',
        changes: { updated: results.length, details: results }
      });

      return results;
    } catch (error) {
      console.error('Bulk price update error:', error);
      throw error;
    }
  }

  /**
   * Remove expiring products from listings
   */
  async removeExpiringProducts() {
    try {
      const today = new Date();
      const removed = [];

      const products = await Product.find({ isPerishable: true });

      for (const product of products) {
        if (!product.inventoryBatches) continue;

        for (const batch of product.inventoryBatches) {
          if (batch.expiryDate && new Date(batch.expiryDate) <= today) {
            // Remove expired batch
            product.inventoryBatches = product.inventoryBatches.filter(
              b => b.batchNumber !== batch.batchNumber
            );
            
            // Update stock
            product.stock -= batch.quantity;
            if (product.stock < 0) product.stock = 0;

            removed.push({
              productName: product.name,
              batchNumber: batch.batchNumber,
              quantity: batch.quantity,
              expiryDate: batch.expiryDate
            });
          }
        }

        await product.save();
      }

      await AuditLog.create({
        action: 'remove_expired_products',
        entity: 'product',
        changes: { removed: removed.length, details: removed }
      });

      return removed;
    } catch (error) {
      console.error('Remove expiring products error:', error);
      throw error;
    }
  }

  // ========== ORDER MANAGEMENT ==========

  /**
   * Monitor incoming online orders
   */
  async getOnlineOrders(status = 'Pending', limit = 50) {
    try {
      const orders = await Order.find({ status })
        .populate('user', 'name email phone')
        .populate('items.product', 'name price stock')
        .sort({ createdAt: -1 })
        .limit(limit);

      return orders;
    } catch (error) {
      console.error('Get online orders error:', error);
      throw error;
    }
  }

  /**
   * Check for overselling issues
   */
  async checkOverselling() {
    try {
      const issues = [];
      const pendingOrders = await Order.find({ 
        status: { $in: ['Pending', 'Processing'] },
        isPaid: true
      }).populate('items.product');

      for (const order of pendingOrders) {
        for (const item of order.items) {
          if (item.product && item.product.stock < item.quantity) {
            issues.push({
              orderId: order._id,
              productId: item.product._id,
              productName: item.product.name,
              ordered: item.quantity,
              available: item.product.stock,
              shortfall: item.quantity - item.product.stock
            });
          }
        }
      }

      if (issues.length > 0) {
        await AuditLog.create({
          action: 'overselling_detected',
          entity: 'order',
          changes: { issues: issues.length, details: issues }
        });
      }

      return issues;
    } catch (error) {
      console.error('Check overselling error:', error);
      throw error;
    }
  }

  // ========== REPORTING ==========

  /**
   * Daily sales report (online vs offline)
   */
  async getDailySalesReport(date = new Date()) {
    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const orders = await Order.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        isPaid: true
      });

      const report = {
        date: startOfDay.toDateString(),
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        averageOrderValue: 0,
        topProducts: [],
        hourlyBreakdown: []
      };

      if (orders.length > 0) {
        report.averageOrderValue = report.totalRevenue / orders.length;
      }

      // Product sales count
      const productSales = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          const productId = item.product.toString();
          if (!productSales[productId]) {
            productSales[productId] = {
              name: item.name,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += item.price * item.quantity;
        });
      });

      report.topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ productId: id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return report;
    } catch (error) {
      console.error('Daily sales report error:', error);
      throw error;
    }
  }

  /**
   * Category performance report
   */
  async getCategoryPerformance(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const orders = await Order.find({
        createdAt: { $gte: startDate },
        isPaid: true
      }).populate('items.product');

      const categoryStats = {};

      orders.forEach(order => {
        order.items.forEach(item => {
          if (!item.product) return;
          
          const category = item.product.category;
          if (!categoryStats[category]) {
            categoryStats[category] = {
              category,
              totalSales: 0,
              totalRevenue: 0,
              productCount: new Set()
            };
          }

          categoryStats[category].totalSales += item.quantity;
          categoryStats[category].totalRevenue += item.price * item.quantity;
          categoryStats[category].productCount.add(item.product._id.toString());
        });
      });

      const report = Object.values(categoryStats).map(stat => ({
        category: stat.category,
        totalSales: stat.totalSales,
        totalRevenue: stat.totalRevenue,
        uniqueProducts: stat.productCount.size,
        averageRevenuePerProduct: stat.totalRevenue / stat.productCount.size
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);

      return report;
    } catch (error) {
      console.error('Category performance error:', error);
      throw error;
    }
  }

  /**
   * Inventory valuation report
   */
  async getInventoryValuation() {
    try {
      const products = await Product.find({ stock: { $gt: 0 } });

      let totalValue = 0;
      const categoryBreakdown = {};

      products.forEach(product => {
        const value = product.price * product.stock;
        totalValue += value;

        if (!categoryBreakdown[product.category]) {
          categoryBreakdown[product.category] = {
            category: product.category,
            totalValue: 0,
            productCount: 0,
            totalUnits: 0
          };
        }

        categoryBreakdown[product.category].totalValue += value;
        categoryBreakdown[product.category].productCount++;
        categoryBreakdown[product.category].totalUnits += product.stock;
      });

      return {
        totalInventoryValue: totalValue,
        totalProducts: products.length,
        categoryBreakdown: Object.values(categoryBreakdown)
      };
    } catch (error) {
      console.error('Inventory valuation error:', error);
      throw error;
    }
  }

  /**
   * Stock turnover ratio
   */
  async getStockTurnoverRatio(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Cost of goods sold
      const orders = await Order.find({
        createdAt: { $gte: startDate },
        isPaid: true
      });

      let cogs = 0;
      orders.forEach(order => {
        order.items.forEach(item => {
          cogs += item.price * item.quantity;
        });
      });

      // Average inventory value
      const inventoryValuation = await this.getInventoryValuation();
      const avgInventoryValue = inventoryValuation.totalInventoryValue;

      const turnoverRatio = avgInventoryValue > 0 ? cogs / avgInventoryValue : 0;

      return {
        period: `${days} days`,
        costOfGoodsSold: cogs,
        averageInventoryValue: avgInventoryValue,
        turnoverRatio: turnoverRatio.toFixed(2),
        daysToSellInventory: turnoverRatio > 0 ? (days / turnoverRatio).toFixed(0) : 'N/A'
      };
    } catch (error) {
      console.error('Stock turnover ratio error:', error);
      throw error;
    }
  }
}

module.exports = StoreManager;
