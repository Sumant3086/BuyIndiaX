/**
 * Lightweight async job queue — no external dependencies (no BullMQ/Redis required).
 *
 * Implements:
 * - In-memory FIFO queue with named job types
 * - Per-job-type concurrency limits
 * - Exponential back-off retry (up to maxRetries)
 * - Graceful shutdown drain
 * - Event emitter for monitoring
 *
 * Production upgrade path: swap processJob() internals with BullMQ workers when scaling beyond single-instance.
 */

const EventEmitter = require('events');

const DEFAULT_CONFIG = {
  maxRetries: 3,
  baseRetryDelayMs: 1000,
  concurrency: 5
};

class JobQueue extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...options };
    this._queue = [];
    this._running = 0;
    this._handlers = new Map();
    this._stats = { processed: 0, failed: 0, retried: 0 };
    this._draining = false;
  }

  /**
   * Register a handler for a job type.
   * handler(data) should return a Promise.
   */
  process(jobType, handler) {
    this._handlers.set(jobType, handler);
    return this;
  }

  /**
   * Add a job to the queue.
   */
  add(jobType, data, opts = {}) {
    if (!this._handlers.has(jobType)) {
      console.warn(`[Queue:${this.name}] No handler registered for job type: ${jobType}`);
      return;
    }

    const job = {
      id: `${jobType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: jobType,
      data,
      attempts: 0,
      maxRetries: opts.maxRetries ?? this.config.maxRetries,
      priority: opts.priority ?? 0,
      addedAt: Date.now()
    };

    // Priority queue: higher priority jobs go to front
    if (opts.priority && opts.priority > 0) {
      this._queue.unshift(job);
    } else {
      this._queue.push(job);
    }

    setImmediate(() => this._tick());
    return job.id;
  }

  _tick() {
    if (this._draining || this._running >= this.config.concurrency || this._queue.length === 0) return;

    const job = this._queue.shift();
    this._running++;
    this._execute(job);
  }

  async _execute(job) {
    const handler = this._handlers.get(job.type);
    job.attempts++;
    job.startedAt = Date.now();

    try {
      await handler(job.data);
      this._stats.processed++;
      this.emit('completed', { id: job.id, type: job.type, attempts: job.attempts });
    } catch (error) {
      const willRetry = job.attempts < job.maxRetries;
      this._stats.failed++;

      this.emit('failed', { id: job.id, type: job.type, error: error.message, willRetry });

      if (willRetry) {
        this._stats.retried++;
        const delay = this.config.baseRetryDelayMs * Math.pow(2, job.attempts - 1);
        setTimeout(() => {
          this._queue.push(job);
          this._tick();
        }, delay);
      }
    } finally {
      this._running--;
      setImmediate(() => this._tick());
    }
  }

  /**
   * Drain: wait for all current jobs to complete, then stop accepting new ones.
   */
  async drain() {
    this._draining = true;
    return new Promise((resolve) => {
      const check = () => {
        if (this._queue.length === 0 && this._running === 0) resolve();
        else setTimeout(check, 100);
      };
      check();
    });
  }

  stats() {
    return { ...this._stats, queued: this._queue.length, running: this._running };
  }
}

// ── Singleton queues for the application ──

const emailQueue = new JobQueue('email', { concurrency: 3, maxRetries: 3 });
const notificationQueue = new JobQueue('notification', { concurrency: 5 });
const activityQueue = new JobQueue('activity', { concurrency: 10, maxRetries: 1 });
const inventoryQueue = new JobQueue('inventory', { concurrency: 2 });

// ── Email job handlers ──
emailQueue
  .process('order_confirmation', async ({ user, order }) => {
    const { sendOrderConfirmation } = require('./emailService');
    await sendOrderConfirmation(user, order);
  })
  .process('shipping_update', async ({ user, order }) => {
    const { sendShippingUpdate } = require('./emailService');
    await sendShippingUpdate(user, order);
  })
  .process('cart_abandonment', async ({ user, cart }) => {
    const { sendCartAbandonmentEmail } = require('./emailService');
    if (sendCartAbandonmentEmail) await sendCartAbandonmentEmail(user, cart);
  })
  .process('low_stock_alert', async ({ productName, stock, email }) => {
    const { sendLowStockAlert } = require('./emailService');
    if (sendLowStockAlert) await sendLowStockAlert(email, productName, stock);
  });

// ── Notification job handlers ──
notificationQueue
  .process('order_update', async ({ userId, orderId, status, message, notificationService }) => {
    if (notificationService) {
      await notificationService.sendOrderUpdate(userId, orderId, status, message);
    }
  })
  .process('payment_confirmation', async ({ userId, orderId, amount, notificationService }) => {
    if (notificationService) {
      await notificationService.sendPaymentConfirmation(userId, orderId, amount);
    }
  });

// ── Activity tracking handlers ──
activityQueue
  .process('track_view', async ({ userId, productId }) => {
    const UserActivity = require('../models/UserActivity');
    await UserActivity.create({ user: userId, activityType: 'view', product: productId });
  })
  .process('update_recently_viewed', async ({ userId, productId }) => {
    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, {
      $pull: { recentlyViewed: { product: productId } }
    });
    await User.findByIdAndUpdate(userId, {
      $push: { recentlyViewed: { $each: [{ product: productId, viewedAt: new Date() }], $position: 0, $slice: 20 } }
    });
  });

// ── Inventory job handlers ──
inventoryQueue
  .process('check_low_stock', async ({ productId }) => {
    const StockAlertSystem = require('./stockAlertSystem');
    const alertSystem = new StockAlertSystem();
    if (typeof alertSystem.checkProduct === 'function') {
      await alertSystem.checkProduct(productId);
    }
  })
  .process('expire_batches', async () => {
    const InventoryBatch = require('../models/InventoryBatch');
    const Product = require('../models/Product');
    const expired = await InventoryBatch.find({
      status: 'active', expiryDate: { $lt: new Date() }, quantity: { $gt: 0 }
    }).lean();

    for (const batch of expired) {
      await InventoryBatch.findByIdAndUpdate(batch._id, { status: 'expired', quantity: 0 });
      await Product.findByIdAndUpdate(batch.product, { $inc: { stock: -batch.quantity } });
    }
  });

// ── Log errors ──
[emailQueue, notificationQueue, activityQueue, inventoryQueue].forEach(q => {
  q.on('failed', ({ id, type, error, willRetry }) => {
    console.error(`[Queue:${q.name}] Job ${id} (${type}) failed: ${error}. ${willRetry ? 'Retrying.' : 'No more retries.'}`);
  });
});

// ── Graceful shutdown ──
const gracefulDrainAll = async () => {
  await Promise.all([
    emailQueue.drain(),
    notificationQueue.drain(),
    activityQueue.drain(),
    inventoryQueue.drain()
  ]);
};

process.on('SIGTERM', gracefulDrainAll);
process.on('SIGINT', gracefulDrainAll);

module.exports = {
  emailQueue,
  notificationQueue,
  activityQueue,
  inventoryQueue,
  gracefulDrainAll
};
