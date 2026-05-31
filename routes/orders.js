const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const OrderCounter = require('../models/OrderCounter');
const { auth, requirePermission } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const StockReservationService = require('../utils/stockReservation');
const GSTCalculator = require('../utils/gstCalculator');

// Create order — with sequential order number, GST calculation, stock reservation check
router.post('/', auth, orderLimiter, async (req, res) => {
  try {
    const { shippingAddress, couponCode, useStoreCredit, gstNumber } = req.body;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const validItems = cart.items.filter(item => item.product && item.product.stock >= 0);
    if (validItems.length === 0) {
      return res.status(400).json({ message: 'No valid products in cart' });
    }

    // Stock availability check (uses reservation-aware available stock)
    for (const item of validItems) {
      const stockInfo = await StockReservationService.getAvailableStock(item.product._id);
      if (!stockInfo || stockInfo.available < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${item.product.name}". Available: ${stockInfo?.available ?? 0}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate GST per item
    const cartItemsForGST = validItems.map(item => ({
      price: item.product.price * (1 - (item.product.discount || 0) / 100),
      quantity: item.quantity,
      category: item.product.category,
      hsnCode: item.product.hsnCode
    }));

    const gstResult = await GSTCalculator.calculateForOrder(cartItemsForGST);

    const orderItems = validItems.map((item, idx) => {
      const discountedPrice = item.product.price * (1 - (item.product.discount || 0) / 100);
      const gstItem = gstResult.items[idx];
      return {
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: discountedPrice,
        cgst: gstItem?.cgst || 0,
        sgst: gstItem?.sgst || 0,
        igst: gstItem?.igst || 0,
        gstRate: (gstItem?.cgstRate || 0) + (gstItem?.sgstRate || 0)
      };
    });

    const subtotal = gstResult.taxableAmount;
    const taxAmount = gstResult.totalGST;
    const totalAmount = Math.round(subtotal + taxAmount);

    const orderNumber = await OrderCounter.nextOrderNumber('BIX');

    const order = new Order({
      orderNumber,
      user: userId,
      items: orderItems,
      shippingAddress,
      subtotal,
      tax: taxAmount,
      totalAmount,
      paymentMethod: 'Razorpay',
      couponCode: couponCode || null,
      gstNumber: gstNumber || null,
      statusHistory: [{ status: 'Pending', timestamp: new Date(), note: 'Order created' }]
    });

    await order.save();

    // Create stock reservation for 15 minutes
    try {
      await StockReservationService.reserve(
        userId,
        order._id.toString(),
        validItems.map(i => ({ productId: i.product._id.toString(), quantity: i.quantity }))
      );
    } catch (reserveErr) {
      // Non-fatal: log but don't block order creation (reservation is a soft lock)
      console.error('Stock reservation warning:', reserveErr.message);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user's orders
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, status } = req.query;
    const query = { user: userId };
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name image price category')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image price category')
      .lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: All orders with pagination
router.get('/admin/all', auth, requirePermission('view_orders'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .populate('items.product', 'name price')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    const [revenueResult] = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const statusBreakdown = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total
      },
      statistics: {
        totalRevenue: revenueResult?.total || 0,
        ordersByStatus: statusBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Update order status with status history
router.put('/admin/:id/status', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const { status, note, trackingNumber, estimatedDelivery } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const update = {
      status,
      $push: { statusHistory: { status, timestamp: new Date(), note: note || '' } }
    };

    if (status === 'Shipped') {
      update.shippedAt = new Date();
      if (trackingNumber) update.trackingNumber = trackingNumber;
      if (estimatedDelivery) update.estimatedDelivery = new Date(estimatedDelivery);
    }
    if (status === 'Delivered') {
      update.deliveredAt = new Date();
      update.isDelivered = true;
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email')
      .populate('items.product', 'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Push real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${order.user._id}`).emit('order-update', { orderId: order._id, status });
    }

    // Notify customer
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.sendOrderUpdate(order.user._id, order._id, status, note);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Comprehensive dashboard
router.get('/admin/dashboard', auth, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { cache, invalidateCache } = require('../middleware/cache');
    const cacheKey = 'cache:GET:/api/orders/admin/dashboard';
    const { getCache, setCache } = require('../utils/redisClient');
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [
      totalOrders,
      totalUsers,
      totalProducts,
      revenueResult,
      recentOrders,
      statusBreakdown,
      monthlyRevenue,
      topProducts
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.find({}).populate('user', 'name email').sort({ createdAt: -1 }).limit(8).lean(),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Product.find({}).sort({ salesCount: -1 }).limit(10).select('name salesCount price category').lean()
    ]);

    const result = {
      summary: {
        totalOrders,
        totalUsers,
        totalProducts,
        totalRevenue: revenueResult[0]?.total || 0
      },
      recentOrders,
      ordersByStatus: statusBreakdown,
      monthlyRevenue,
      topProducts
    };

    await setCache(cacheKey, result, 300);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
