const cron = require('node-cron');
const CartAbandonmentTracker = require('./cartAbandonmentTracker');
const PriceDropMonitor = require('./priceDropMonitor');

class ScheduledJobs {
  static init(notificationService) {
    console.log('Initializing scheduled jobs...');

    // Abandoned cart check — daily 10 AM IST
    cron.schedule('0 10 * * *', async () => {
      try {
        const results = await CartAbandonmentTracker.checkAbandonedCarts();
        console.log(`Abandoned cart emails sent: ${results.length}`);
      } catch (error) {
        console.error('Abandoned cart check failed:', error.message);
      }
    });

    // Price drop alerts — daily 9 AM IST
    cron.schedule('0 9 * * *', async () => {
      try {
        const results = await PriceDropMonitor.checkPriceDrops();
        console.log(`Price drop alerts sent: ${results.length}`);
      } catch (error) {
        console.error('Price drop check failed:', error.message);
      }
    });

    // Cleanup old read notifications — weekly Sunday 2 AM
    cron.schedule('0 2 * * 0', async () => {
      try {
        const Notification = require('../models/Notification');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo }, isRead: true });
        console.log(`Deleted ${result.deletedCount} old notifications`);
      } catch (error) {
        console.error('Notification cleanup failed:', error.message);
      }
    });

    // Product ranking update — daily midnight using bulkWrite (fixes N+1 problem)
    cron.schedule('0 0 * * *', async () => {
      try {
        const Product = require('../models/Product');
        const products = await Product.find({}).select('_id views salesCount');

        const bulkOps = products.map(product => ({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { trendingScore: (product.views * 0.3) + (product.salesCount * 0.7) } }
          }
        }));

        if (bulkOps.length > 0) {
          const result = await Product.bulkWrite(bulkOps, { ordered: false });
          console.log(`Product rankings updated: ${result.modifiedCount} products`);
        }
      } catch (error) {
        console.error('Product ranking update failed:', error.message);
      }
    });

    // Expiry alert — daily 8 AM: notify about batches expiring in 7 days
    cron.schedule('0 8 * * *', async () => {
      try {
        const InventoryBatch = require('../models/InventoryBatch');
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const expiringSoon = await InventoryBatch.find({
          status: 'active',
          expiryDate: { $lte: sevenDaysFromNow, $gte: new Date() },
          quantity: { $gt: 0 }
        }).populate('product', 'name').populate('warehouse', 'name');

        if (expiringSoon.length > 0 && notificationService) {
          console.log(`Found ${expiringSoon.length} batches expiring within 7 days`);
        }

        // Auto-mark expired batches and reduce product stock
        const expired = await InventoryBatch.find({
          status: 'active',
          expiryDate: { $lt: new Date() },
          quantity: { $gt: 0 }
        }).populate('product');

        for (const batch of expired) {
          const qty = batch.quantity;
          batch.status = 'expired';
          batch.quantity = 0;
          await batch.save();

          if (batch.product) {
            await require('../models/Product').findByIdAndUpdate(batch.product._id, { $inc: { stock: -qty } });
          }
        }

        if (expired.length > 0) {
          console.log(`Auto-expired ${expired.length} batches and deducted stock`);
        }
      } catch (error) {
        console.error('Expiry check failed:', error.message);
      }
    });

    // Low stock auto-reorder check — daily 11 AM
    cron.schedule('0 11 * * *', async () => {
      try {
        const ReorderSystem = require('./reorderSystem');
        if (ReorderSystem && typeof ReorderSystem.checkAndReorder === 'function') {
          await ReorderSystem.checkAndReorder();
        }
      } catch (error) {
        console.error('Reorder check failed:', error.message);
      }
    });

    console.log('Scheduled jobs initialized');
  }

  static async runAbandonedCartCheck() {
    return CartAbandonmentTracker.checkAbandonedCarts();
  }

  static async runPriceDropCheck() {
    return PriceDropMonitor.checkPriceDrops();
  }
}

module.exports = ScheduledJobs;
