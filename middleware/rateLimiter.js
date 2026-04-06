const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

// Per-user rate limiter (requires authentication)
const createUserLimiter = (maxRequests = 50, windowMinutes = 15) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?._id?.toString() || req.ip;
    },
    message: 'You have exceeded your request limit. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil(windowMinutes * 60)
      });
    }
  });
};

// Payment route limiter (per user)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: 'Too many payment attempts, please try again later.',
});

// Order creation limiter (per user)
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: 'Too many order creation attempts. Please try again later.',
});

// Search limiter
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many search requests, please slow down.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  searchLimiter,
  createUserLimiter,
  orderLimiter
};
