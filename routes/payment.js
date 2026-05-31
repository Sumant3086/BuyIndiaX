const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const InventoryManager = require('../utils/inventoryManager');
const OrderWorkflow = require('../utils/orderWorkflow');
const WebhookDispatcher = require('../utils/webhookDispatcher');
const { emailQueue, notificationQueue } = require('../utils/jobQueue');
const StockReservationService = require('../utils/stockReservation');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', auth, paymentLimiter, async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== userId.toString()) return res.status(403).json({ message: 'Access denied' });
    if (order.isPaid) return res.status(400).json({ message: 'Order already paid' });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: order._id.toString(),
      notes: { orderId: order._id.toString(), userId: userId.toString() }
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderDetails: order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify payment (idempotent — safe to call multiple times)
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id || req.user._id;

    // Signature verification
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const sigBuf = Buffer.from(razorpay_signature || '');
    const expBuf = Buffer.from(expectedSign);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Idempotency: if already paid with same payment ID, return success
    if (order.isPaid && order.paymentResult?.razorpay_payment_id === razorpay_payment_id) {
      return res.json({ message: 'Payment already verified', order });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Order already paid with a different payment' });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'Processing';
    order.paymentResult = { razorpay_order_id, razorpay_payment_id, razorpay_signature };

    // Deduct stock using FIFO/FEFO
    for (const item of order.items) {
      try {
        await InventoryManager.deductStock(item.product, item.quantity);
        await Product.findByIdAndUpdate(item.product, { $inc: { salesCount: item.quantity } });
      } catch (err) {
        console.error(`Stock deduction failed for product ${item.product}:`, err.message);
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, salesCount: item.quantity }
        });
      }
    }

    // Award loyalty points and update membership tier
    const pointsEarned = Math.floor(order.totalAmount / 100);
    const user = await User.findById(userId);
    if (user) {
      user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsEarned;
      user.totalSpent = (user.totalSpent || 0) + order.totalAmount;
      if (user.totalSpent >= 50000) user.membershipTier = 'Platinum';
      else if (user.totalSpent >= 25000) user.membershipTier = 'Gold';
      else if (user.totalSpent >= 10000) user.membershipTier = 'Silver';
      await user.save();
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [], totalAmount: 0 });

    order.loyaltyPointsEarned = pointsEarned;
    await order.save();

    // Convert stock reservation to confirmed sale
    try {
      await StockReservationService.convertToSale(userId, orderId, order._id);
    } catch { /* non-fatal */ }

    // Async side-effects via job queues (non-blocking)
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      notificationQueue.add('payment_confirmation', { userId, orderId, amount: order.totalAmount, notificationService });
    }

    // Queue order confirmation email
    const populatedUser = await User.findById(userId).select('name email');
    if (populatedUser?.email) {
      emailQueue.add('order_confirmation', { user: populatedUser, order });
    }

    // Dispatch webhook
    WebhookDispatcher.dispatch('order.paid', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId,
      totalAmount: order.totalAmount,
      loyaltyPointsEarned: pointsEarned
    });
    WebhookDispatcher.dispatch('payment.success', {
      razorpay_payment_id,
      orderId: order._id,
      amount: order.totalAmount
    });

    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Process Razorpay refund via API (admin only)
router.post('/refund/:orderId', auth, adminAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!order.isPaid) return res.status(400).json({ message: 'Order was not paid' });
    if (!order.paymentResult?.razorpay_payment_id) {
      return res.status(400).json({ message: 'No Razorpay payment ID found for this order' });
    }

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(order.totalAmount * 100);

    const refund = await razorpay.payments.refund(order.paymentResult.razorpay_payment_id, {
      amount: refundAmount,
      notes: { orderId: order._id.toString(), reason: 'Customer request' }
    });

    order.refund = {
      amount: refundAmount / 100,
      method: 'razorpay',
      processedAt: new Date(),
      status: 'Processed',
      razorpayRefundId: refund.id
    };
    order.status = 'Refunded';
    await order.save();

    res.json({ message: 'Refund processed via Razorpay', refund });
  } catch (error) {
    console.error('Razorpay refund error:', error);
    res.status(500).json({ message: 'Refund failed', error: error.message });
  }
});

// Razorpay webhook (no auth — verified by HMAC signature)
// Raw body is parsed in server.js before global express.json(), so req.body is a Buffer here.
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET not set — webhook validation skipped');
    } else {
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');

      const sigBuf = Buffer.from(signature || '');
      const expBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === 'payment.failed') {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.notes?.orderId;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          $push: {
            statusHistory: {
              status: 'Payment Failed',
              timestamp: new Date(),
              note: `Razorpay payment ${paymentId} failed`
            }
          }
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

// Payment retry (user can only retry their own unpaid orders)
router.post('/retry/:orderId', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== userId.toString()) return res.status(403).json({ message: 'Access denied' });
    if (order.isPaid) return res.status(400).json({ message: 'Order already paid' });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: order._id.toString(),
      notes: { orderId: order._id.toString(), retry: true }
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
