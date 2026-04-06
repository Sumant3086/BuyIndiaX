const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Initialize Razorpay with test credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SZT2as0qsWZtkR',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'uJLKwIAhb6JcXu2PWIoBzHhC'
});

// Create Razorpay order (direct integration)
router.post('/create-order', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const options = {
      amount: order.totalAmount * 100, // amount in paise
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: userId.toString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SZT2as0qsWZtkR',
      orderDetails: order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id || req.user._id;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'uJLKwIAhb6JcXu2PWIoBzHhC')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'Processing';
      order.paymentResult = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      };

      // Update product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }

      // Award loyalty points
      const pointsEarned = Math.floor(order.totalAmount / 100);
      const user = await User.findById(userId);
      user.loyaltyPoints += pointsEarned;
      user.totalSpent += order.totalAmount;

      // Update membership tier
      if (user.totalSpent >= 50000) user.membershipTier = 'Platinum';
      else if (user.totalSpent >= 25000) user.membershipTier = 'Gold';
      else if (user.totalSpent >= 10000) user.membershipTier = 'Silver';
      
      await user.save();

      // Clear user cart
      await Cart.findOneAndUpdate(
        { user: userId },
        { items: [], totalAmount: 0 }
      );

      await order.save();

      res.json({ message: 'Payment verified successfully', order });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
