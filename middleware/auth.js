const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCache, setCache, deleteCache, isRedisAvailable } = require('../utils/redisClient');

const ROLE_PERMISSIONS = {
  admin: ['view_products', 'manage_products', 'view_orders', 'manage_orders', 'view_inventory', 'manage_inventory', 'view_analytics', 'manage_users', 'manage_coupons', 'view_customers', 'manage_customers', 'process_refunds'],
  manager: ['view_products', 'manage_products', 'view_orders', 'manage_orders', 'view_inventory', 'manage_inventory', 'view_analytics', 'view_customers'],
  inventory_staff: ['view_products', 'view_inventory', 'manage_inventory'],
  sales_staff: ['view_products', 'view_orders', 'view_customers'],
  support_staff: ['view_products', 'view_orders', 'view_customers', 'process_refunds'],
  user: ['view_products']
};

const USER_CACHE_TTL = 300; // 5 minutes

/**
 * JWT authentication middleware with Redis session caching.
 * Avoids a DB query on every single API request.
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const cacheKey = `user:session:${decoded.userId}`;

    let userData = null;

    // Try Redis cache first
    if (isRedisAvailable()) {
      userData = await getCache(cacheKey);
    }

    if (!userData) {
      const user = await User.findById(decoded.userId).select('-password -twoFactorSecret');
      if (!user) return res.status(401).json({ message: 'User not found' });

      const rolePermissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.user;
      const allPermissions = [...new Set([...rolePermissions, ...(user.permissions || [])])];

      userData = {
        _id: user._id.toString(),
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: allPermissions,
        department: user.department,
        phone: user.phone,
        address: user.address,
        loyaltyPoints: user.loyaltyPoints,
        totalSpent: user.totalSpent,
        membershipTier: user.membershipTier
      };

      if (isRedisAvailable()) {
        await setCache(cacheKey, userData, USER_CACHE_TTL);
      }
    }

    req.user = userData;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

/**
 * Invalidate user cache (call on role/permission change, logout, password reset).
 */
const invalidateUserCache = async (userId) => {
  if (isRedisAvailable()) {
    await deleteCache(`user:session:${userId}`);
  }
};

const adminAuth = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied. Admin only.' });
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (req.user.role === 'admin' || req.user.permissions.includes(permission)) return next();
  res.status(403).json({
    message: `Access denied. Required permission: ${permission}`,
    userRole: req.user.role
  });
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (roles.includes(req.user.role)) return next();
  res.status(403).json({
    message: `Access denied. Required role: ${roles.join(' or ')}`,
    userRole: req.user.role
  });
};

module.exports = { auth, adminAuth, requirePermission, requireRole, invalidateUserCache, ROLE_PERMISSIONS };
