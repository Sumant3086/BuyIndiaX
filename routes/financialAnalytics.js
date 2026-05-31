const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const InventoryBatch = require('../models/InventoryBatch');
const POSSale = require('../models/POSSale');
const Return = require('../models/Return');
const { auth, requirePermission } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { getCache, setCache } = require('../utils/redisClient');

const TTL = { short: 300, medium: 900, long: 3600 };

const dateRange = (days) => new Date(Date.now() - days * 86400000);

// ── Revenue Overview ──────────────────────────────────────────────────────────
router.get('/revenue/overview', auth, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const since = dateRange(days);
    const prevSince = dateRange(days * 2);

    const cacheKey = `fin:revenue:overview:${days}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [
      currentRevenue,
      prevRevenue,
      currentOrders,
      prevOrders,
      refundedValue,
      posRevenue
    ] = await Promise.all([
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 }, avgOrder: { $avg: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: prevSince, $lt: since } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ isPaid: true, createdAt: { $gte: since } }),
      Order.countDocuments({ isPaid: true, createdAt: { $gte: prevSince, $lt: since } }),
      Order.aggregate([
        { $match: { status: 'Refunded', createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      POSSale.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ])
    ]);

    const curr = currentRevenue[0] || { total: 0, count: 0, avgOrder: 0 };
    const prev = prevRevenue[0] || { total: 0 };
    const refunded = refundedValue[0]?.total || 0;
    const pos = posRevenue[0] || { total: 0, count: 0 };

    const growthPct = prev.total > 0 ? ((curr.total - prev.total) / prev.total * 100).toFixed(1) : 0;
    const orderGrowthPct = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders * 100).toFixed(1) : 0;

    const result = {
      period: `${days}d`,
      online: { revenue: curr.total, orders: curr.count, avgOrderValue: Math.round(curr.avgOrder || 0) },
      pos: { revenue: pos.total, transactions: pos.count },
      combined: { revenue: curr.total + pos.total },
      refunded,
      netRevenue: curr.total + pos.total - refunded,
      growth: { revenueGrowthPct: parseFloat(growthPct), orderGrowthPct: parseFloat(orderGrowthPct) }
    };

    await setCache(cacheKey, result, TTL.short);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Daily Revenue Trend (for charts) ─────────────────────────────────────────
router.get('/revenue/trend', auth, requirePermission('view_analytics'), cache(TTL.short), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = dateRange(parseInt(days));

    const [onlineTrend, posTrend] = await Promise.all([
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
            avgOrder: { $avg: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      POSSale.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$grandTotal' },
            transactions: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Merge online + POS by date
    const dateMap = {};
    for (const d of onlineTrend) {
      dateMap[d._id] = { date: d._id, onlineRevenue: d.revenue, onlineOrders: d.orders, posRevenue: 0, posTransactions: 0 };
    }
    for (const d of posTrend) {
      if (!dateMap[d._id]) dateMap[d._id] = { date: d._id, onlineRevenue: 0, onlineOrders: 0, posRevenue: 0, posTransactions: 0 };
      dateMap[d._id].posRevenue = d.revenue;
      dateMap[d._id].posTransactions = d.transactions;
    }

    const trend = Object.values(dateMap)
      .map(d => ({ ...d, totalRevenue: d.onlineRevenue + d.posRevenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Category Performance ──────────────────────────────────────────────────────
router.get('/categories/performance', auth, requirePermission('view_analytics'), cache(TTL.medium), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = dateRange(parseInt(days));

    const performance = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          unitsSold: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
          avgPrice: { $avg: '$items.price' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Top Products by Revenue ───────────────────────────────────────────────────
router.get('/products/top', auth, requirePermission('view_analytics'), cache(TTL.medium), async (req, res) => {
  try {
    const { days = 30, limit = 20 } = req.query;
    const since = dateRange(parseInt(days));

    const topProducts = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          unitsSold: { $sum: '$items.quantity' },
          orderCount: { $addToSet: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          price: '$product.price',
          stock: '$product.stock',
          revenue: 1,
          unitsSold: 1,
          orderCount: { $size: '$orderCount' },
          revenuePerUnit: { $divide: ['$revenue', '$unitsSold'] }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Customer Analytics ────────────────────────────────────────────────────────
router.get('/customers/overview', auth, requirePermission('view_analytics'), cache(TTL.medium), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = dateRange(parseInt(days));

    const [
      newCustomers,
      activeCustomers,
      topCustomers,
      membershipBreakdown
    ] = await Promise.all([
      User.countDocuments({ role: 'user', createdAt: { $gte: since } }),
      Order.distinct('user', { isPaid: true, createdAt: { $gte: since } }),
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: since } } },
        { $group: { _id: '$user', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        {
          $project: {
            name: '$userInfo.name',
            email: '$userInfo.email',
            membershipTier: '$userInfo.membershipTier',
            totalSpent: 1,
            orderCount: 1
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]),
      User.aggregate([
        { $match: { role: 'user' } },
        { $group: { _id: '$membershipTier', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      newCustomers,
      activeCustomers: activeCustomers.length,
      topCustomers,
      membershipBreakdown,
      repeatPurchaseRate: activeCustomers.length > 0
        ? ((topCustomers.filter(c => c.orderCount > 1).length / topCustomers.length) * 100).toFixed(1)
        : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Inventory Analytics ───────────────────────────────────────────────────────
router.get('/inventory/health', auth, requirePermission('view_analytics'), cache(TTL.medium), async (req, res) => {
  try {
    const [
      totalProducts,
      outOfStock,
      lowStock,
      expiringIn30,
      expiredBatches,
      totalValue
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, stock: { $gt: 0 } }),
      InventoryBatch.countDocuments({
        status: 'active',
        expiryDate: { $lte: new Date(Date.now() + 30 * 86400000), $gte: new Date() }
      }),
      InventoryBatch.countDocuments({ status: 'expired' }),
      InventoryBatch.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, value: { $sum: { $multiply: ['$quantity', '$costPrice'] } } } }
      ])
    ]);

    res.json({
      totalProducts,
      outOfStock,
      lowStock,
      expiringIn30Days: expiringIn30,
      expiredBatches,
      totalInventoryValue: totalValue[0]?.value || 0,
      stockHealthScore: Math.round(((totalProducts - outOfStock - lowStock) / totalProducts) * 100)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── ABC Analysis (inventory classification) ───────────────────────────────────
router.get('/inventory/abc', auth, requirePermission('view_analytics'), cache(TTL.long), async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = dateRange(parseInt(days));

    const salesData = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          unitsSold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' }
      },
      { $unwind: '$p' },
      { $project: { name: '$p.name', category: '$p.category', revenue: 1, unitsSold: 1 } },
      { $sort: { revenue: -1 } }
    ]);

    const totalRevenue = salesData.reduce((s, p) => s + p.revenue, 0);
    let cumulative = 0;
    const classified = salesData.map(p => {
      cumulative += p.revenue;
      const cumulativePct = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
      return {
        ...p,
        revenuePct: totalRevenue > 0 ? (p.revenue / totalRevenue * 100).toFixed(1) : 0,
        cumulativePct: cumulativePct.toFixed(1),
        class: cumulativePct <= 70 ? 'A' : cumulativePct <= 90 ? 'B' : 'C'
      };
    });

    const summary = { A: [], B: [], C: [] };
    classified.forEach(p => summary[p.class].push(p));

    res.json({
      classified,
      summary: {
        A: { count: summary.A.length, revenue: summary.A.reduce((s, p) => s + p.revenue, 0) },
        B: { count: summary.B.length, revenue: summary.B.reduce((s, p) => s + p.revenue, 0) },
        C: { count: summary.C.length, revenue: summary.C.reduce((s, p) => s + p.revenue, 0) }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Return / Shrinkage Analytics ──────────────────────────────────────────────
router.get('/returns/summary', auth, requirePermission('view_analytics'), cache(TTL.medium), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = dateRange(parseInt(days));

    const [returnStats, refundValue] = await Promise.all([
      Return.aggregate([
        { $match: { requestDate: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalRefundAmount' } } }
      ]),
      Order.aggregate([
        { $match: { status: 'Refunded', updatedAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalReturns = returnStats.reduce((s, r) => s + r.count, 0);
    const [ordersInPeriod] = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: since } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    res.json({
      totalReturns,
      returnRate: ordersInPeriod?.count > 0 ? ((totalReturns / ordersInPeriod.count) * 100).toFixed(2) : 0,
      byStatus: returnStats,
      totalRefundValue: refundValue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── Demand Forecast (AI-ready: moving average + trend) ────────────────────────
router.get('/forecast/:productId', auth, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { productId } = req.params;
    const { weeks = 8 } = req.query;

    // Weekly sales for last N weeks
    const since = dateRange(parseInt(weeks) * 7);
    const weeklySales = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $match: { 'items.product': new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' }
          },
          units: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    const units = weeklySales.map(w => w.units);
    const avgWeeklyDemand = units.length > 0 ? units.reduce((s, v) => s + v, 0) / units.length : 0;

    // Simple weighted moving average (recent weeks weighted more)
    const wma = units.length >= 3
      ? (units.slice(-3).reduce((s, v, i) => s + v * (i + 1), 0) / 6)
      : avgWeeklyDemand;

    // Trend: compare first half vs second half
    const mid = Math.floor(units.length / 2);
    const firstHalf = units.slice(0, mid);
    const secondHalf = units.slice(mid);
    const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length : 0;
    const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length : 0;
    const trendPct = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst * 100).toFixed(1) : 0;

    const product = await Product.findById(productId).select('name stock lowStockThreshold');

    res.json({
      productId,
      productName: product?.name,
      currentStock: product?.stock || 0,
      historicalWeeks: weeklySales,
      forecast: {
        avgWeeklyDemand: Math.round(avgWeeklyDemand * 10) / 10,
        weightedMovingAverage: Math.round(wma * 10) / 10,
        trendPct: parseFloat(trendPct),
        trendDirection: trendPct > 5 ? 'increasing' : trendPct < -5 ? 'decreasing' : 'stable',
        estimatedWeeksOfStock: wma > 0 && product ? Math.round(product.stock / wma) : null,
        recommendedReorderQty: Math.ceil(wma * 4), // 4 weeks safety stock
        aiNote: 'Uses weighted moving average. Upgrade to ML forecasting by plugging in the /api/v1/ai/forecast endpoint.'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── POS Analytics ─────────────────────────────────────────────────────────────
router.get('/pos/summary', auth, requirePermission('view_analytics'), cache(TTL.short), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = dateRange(parseInt(days));

    const [daily, paymentMethods, topItems] = await Promise.all([
      POSSale.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$grandTotal' },
            transactions: { $sum: 1 },
            avgBillValue: { $avg: '$grandTotal' },
            totalGST: { $sum: '$totalGST' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      POSSale.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: since } } },
        { $unwind: '$payments' },
        { $group: { _id: '$payments.method', total: { $sum: '$payments.amount' }, count: { $sum: 1 } } }
      ]),
      POSSale.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: since } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            revenue: { $sum: '$items.lineTotal' },
            unitsSold: { $sum: '$items.quantity' },
            name: { $first: '$items.name' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({ daily, paymentMethods, topItems });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
