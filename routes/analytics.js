const express = require('express');
const router = express.Router();
const UserActivity = require('../models/UserActivity');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const { getCollaborativeRecommendations, storeUserInteraction, isRedisAvailable } = require('../utils/redisClient');

// Track user activity — respond immediately, persist in background
router.post('/track', auth, (req, res) => {
  // Respond immediately — client doesn't need to wait for DB writes
  res.json({ ok: true });

  // All tracking is fire-and-forget
  setImmediate(async () => {
    try {
      const { activityType, product, searchQuery, metadata, clickSource, wasRecommendation, checkoutStep, cartValue, timeSpent } = req.body;
      if (!activityType) return;

      await UserActivity.create({
        user: req.user._id,
        activityType,
        product: product || undefined,
        searchQuery: searchQuery || undefined,
        metadata,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        clickSource,
        wasRecommendation,
        checkoutStep,
        cartValue,
        timeSpent
      });

      // Redis collaborative filtering
      if (isRedisAvailable() && product && ['view', 'add_to_cart', 'purchase'].includes(activityType)) {
        const score = activityType === 'purchase' ? 5 : activityType === 'add_to_cart' ? 2 : 1;
        storeUserInteraction(req.user._id.toString(), product, score).catch(() => {});
      }

      // Update recently viewed using atomic $push + $slice (single DB call, no read)
      if (activityType === 'view' && product) {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, {
          $pull: { recentlyViewed: { product } }
        });
        await User.findByIdAndUpdate(req.user._id, {
          $push: {
            recentlyViewed: {
              $each: [{ product, viewedAt: new Date() }],
              $position: 0,
              $slice: 20
            }
          }
        });
      }
    } catch { /* tracking failures are non-fatal */ }
  });
});

// Get user's recently viewed products
router.get('/recently-viewed', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id)
      .populate('recentlyViewed.product')
      .select('recentlyViewed');

    const products = user.recentlyViewed
      .filter(item => item.product) // Filter out deleted products
      .map(item => item.product);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get personalized recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    let recommendations = [];

    // Try Redis collaborative filtering first
    if (isRedisAvailable()) {
      const redisRecommendations = await getCollaborativeRecommendations(req.user._id.toString(), 12);
      
      if (redisRecommendations.length > 0) {
        recommendations = await Product.find({
          _id: { $in: redisRecommendations },
          stock: { $gt: 0 }
        });
        
        if (recommendations.length >= 6) {
          return res.json(recommendations);
        }
      }
    }

    // Fallback to MongoDB-based recommendations
    // Get user's recent activities
    const recentActivities = await UserActivity.find({
      user: req.user._id,
      activityType: { $in: ['view', 'purchase', 'wishlist'] }
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('product');

    // Extract categories and products
    const viewedCategories = {};
    const viewedProducts = new Set();

    recentActivities.forEach(activity => {
      if (activity.product) {
        viewedCategories[activity.product.category] = 
          (viewedCategories[activity.product.category] || 0) + 1;
        viewedProducts.add(activity.product._id.toString());
      }
    });

    // Get top categories
    const topCategories = Object.entries(viewedCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    // Find similar products
    const mongoRecommendations = await Product.find({
      category: { $in: topCategories },
      _id: { $nin: Array.from(viewedProducts) },
      stock: { $gt: 0 }
    })
      .sort({ rating: -1, views: -1 })
      .limit(12);

    recommendations = [...recommendations, ...mongoRecommendations].slice(0, 12);

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get "customers also bought" recommendations
router.get('/also-bought/:productId', async (req, res) => {
  try {
    // Find orders containing this product
    const orders = await Order.find({
      'items.product': req.params.productId,
      isPaid: true
    }).select('items');

    // Count co-purchased products
    const productCounts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product.toString();
        if (productId !== req.params.productId) {
          productCounts[productId] = (productCounts[productId] || 0) + 1;
        }
      });
    });

    // Get top co-purchased products
    const topProductIds = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([productId]) => productId);

    const products = await Product.find({
      _id: { $in: topProductIds },
      stock: { $gt: 0 }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get trending products
router.get('/trending', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get most viewed products in the time period
    const trendingViews = await UserActivity.aggregate([
      {
        $match: {
          activityType: 'view',
          createdAt: { $gte: startDate },
          product: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$product',
          viewCount: { $sum: 1 }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 12 }
    ]);

    const productIds = trendingViews.map(item => item._id);
    const products = await Product.find({ 
      _id: { $in: productIds },
      stock: { $gt: 0 }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get comprehensive analytics
router.get('/admin/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // User behavior analytics
    const activityStats = await UserActivity.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Product performance
    const topProducts = await Product.find()
      .sort({ salesCount: -1, views: -1 })
      .limit(10)
      .select('name salesCount views rating price');

    // Conversion rate
    const totalViews = await UserActivity.countDocuments({ activityType: 'view' });
    const totalPurchases = await UserActivity.countDocuments({ activityType: 'purchase' });
    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews * 100).toFixed(2) : 0;

    // Cart abandonment rate
    const addToCartCount = await UserActivity.countDocuments({ activityType: 'add_to_cart' });
    const abandonmentRate = addToCartCount > 0 
      ? ((addToCartCount - totalPurchases) / addToCartCount * 100).toFixed(2) 
      : 0;

    // CTR for recommendations
    const recommendationClicks = await UserActivity.countDocuments({ 
      activityType: 'click',
      wasRecommendation: true 
    });
    const recommendationViews = await UserActivity.countDocuments({ 
      activityType: 'view',
      clickSource: 'recommendation'
    });
    const recommendationCTR = recommendationViews > 0 
      ? (recommendationClicks / recommendationViews * 100).toFixed(2) 
      : 0;

    // Checkout funnel analysis
    const checkoutStarted = await UserActivity.countDocuments({ 
      activityType: 'checkout_start' 
    });
    const checkoutCompleted = await UserActivity.countDocuments({ 
      activityType: 'purchase' 
    });
    const checkoutDropoffRate = checkoutStarted > 0 
      ? ((checkoutStarted - checkoutCompleted) / checkoutStarted * 100).toFixed(2) 
      : 0;

    // Cart abandonment and recovery metrics
    const CartAbandonmentTracker = require('../utils/cartAbandonmentTracker');
    const abandonmentMetrics = await CartAbandonmentTracker.getAbandonmentRate(30);
    const recoveryMetrics = await CartAbandonmentTracker.getRecoveryMetrics(30);

    res.json({
      activityStats,
      topProducts,
      conversionRate: parseFloat(conversionRate),
      abandonmentRate: parseFloat(abandonmentRate),
      recommendationCTR: parseFloat(recommendationCTR),
      checkoutDropoffRate: parseFloat(checkoutDropoffRate),
      totalViews,
      totalPurchases,
      recommendationClicks,
      recommendationViews,
      checkoutStarted,
      checkoutCompleted,
      cartAbandonment: abandonmentMetrics,
      cartRecovery: recoveryMetrics
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Trigger abandoned cart check manually
router.post('/admin/check-abandoned-carts', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const CartAbandonmentTracker = require('../utils/cartAbandonmentTracker');
    const results = await CartAbandonmentTracker.checkAbandonedCarts();

    res.json({ 
      message: 'Abandoned cart check completed',
      emailsSent: results.length,
      results 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Trigger price drop check manually
router.post('/admin/check-price-drops', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const PriceDropMonitor = require('../utils/priceDropMonitor');
    const results = await PriceDropMonitor.checkPriceDrops();

    res.json({ 
      message: 'Price drop check completed',
      alertsSent: results.length,
      results 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
