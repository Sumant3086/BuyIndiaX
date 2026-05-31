const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const { initRedis } = require('./utils/redisClient');

dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';
const log = isDev ? console.log.bind(console) : () => {};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true },
  // Limit per-socket memory: disable unused transports
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000
});

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(compression({ level: 6, threshold: 1024 }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Raw body for Razorpay webhook (must come BEFORE express.json) ─────────────
// express.json() consumes the stream; the webhook needs the raw Buffer for HMAC
app.use('/api/payment/webhook', express.raw({ type: 'application/json', limit: '1mb' }));

// ── Body parsing (2mb max — adequate for retail APIs) ─────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Sanitization (single pass) ────────────────────────────────────────────────
const { sanitize } = require('./middleware/sanitize');
app.use(sanitize);

// ── Rate limiting ──────────────────────────────────────────────────────────────
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);

// ── Static files ───────────────────────────────────────────────────────────────
if (!isDev) {
  app.use(express.static(path.join(__dirname, 'client/build'), {
    maxAge: '7d',
    etag: true,
    lastModified: true
  }));
}

// ── MongoDB ────────────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: isDev ? 5 : 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });
    log('✓ MongoDB connected:', mongoose.connection.name);
    initRedis().catch(() => log('Redis optional — running without cache persistence'));
    const GSTCalculator = require('./utils/gstCalculator');
    GSTCalculator.seedDefaultRates().catch(() => {});
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    setTimeout(connectDB, 10000);
  }
};

connectDB();

mongoose.connection.on('disconnected', () => log('MongoDB disconnected — reconnecting'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

// ── Socket.IO (with memory leak fixes) ────────────────────────────────────────
const NotificationService = require('./utils/notificationService');
const StockAlertSystem = require('./utils/stockAlertSystem');
const RealTimeUpdates = require('./utils/realTimeUpdates');
const ScheduledJobs = require('./utils/scheduledJobs');

const notificationService = new NotificationService(io);
const stockAlertSystem = new StockAlertSystem(notificationService);
const realTimeUpdates = new RealTimeUpdates(io);

io.on('connection', (socket) => {
  socket.on('join-room', (userId) => {
    if (!userId || typeof userId !== 'string') return;
    socket.join(`user-${userId}`);
    realTimeUpdates.joinUserRoom(socket, userId);
  });

  socket.on('view-product', (productId) => {
    if (!productId || typeof productId !== 'string') return;
    realTimeUpdates.trackProductPageView(socket, productId);
  });

  socket.on('leave-product', (productId) => {
    if (productId) realTimeUpdates.leaveProductRoom(socket, productId);
  });

  // Clean up all rooms on disconnect (handled in RealTimeUpdates)
  socket.on('disconnect', () => {});
});

app.set('io', io);
app.set('notificationService', notificationService);
app.set('stockAlertSystem', stockAlertSystem);
app.set('realTimeUpdates', realTimeUpdates);

ScheduledJobs.init(notificationService);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/order-management', require('./routes/orderManagement'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/finance', require('./routes/financialAnalytics'));
app.use('/api/comparison', require('./routes/comparison'));
app.use('/api/saved-searches', require('./routes/savedSearches'));
app.use('/api/ai', require('./routes/ai-chat'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/warehouse', require('./routes/warehouse'));
app.use('/api/pos', require('./routes/pos'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/store', require('./routes/storeManagement'));
app.use('/api/webhooks', require('./routes/webhooks'));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  if (dbState !== 1) return res.status(503).json({ status: 'degraded', db: 'disconnected' });
  const { isRedisAvailable } = require('./utils/redisClient');
  const { getCacheStats } = require('./middleware/cache');
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    db: 'connected',
    redis: isRedisAvailable() ? 'connected' : 'unavailable',
    cache: getCacheStats(),
    uptime: Math.round(process.uptime()) + 's',
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
  });
});

// ── SPA fallback ───────────────────────────────────────────────────────────────
if (!isDev) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  });
}

// ── Global error handler (non-blocking audit log) ──────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = isDev ? err.message : (statusCode < 500 ? err.message : 'Something went wrong');

  // Non-blocking audit log — never delays the error response
  if (statusCode === 500) {
    setImmediate(() => {
      const AuditLog = require('./models/AuditLog');
      AuditLog.create({
        user: req.user?._id,
        action: 'error',
        entity: 'system',
        changes: { error: err.message },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }).catch(() => {});
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack })
  });
});

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  log(`✓ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
}).on('error', (err) => {
  console.error('Server start error:', err);
  process.exit(1);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
const shutdown = async () => {
  log('Shutting down gracefully...');
  server.close(async () => {
    const { gracefulDrainAll } = require('./utils/jobQueue');
    await gracefulDrainAll().catch(() => {});
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 15000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { io };
