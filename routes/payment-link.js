const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Get payment link for order
router.post('/payment-link', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Return payment link with order details
    const paymentLink = process.env.RAZORPAY_PAYMENT_LINK || 'https://razorpay.me/@sumantyadav';
    
    res.json({
      paymentLink,
      amount: order.totalAmount,
      orderId: order._id,
      message: 'Please complete payment and return to confirm'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manual payment confirmation
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'Processing';
    order.paymentResult = {
      transactionId: transactionId || 'manual_payment',
      paymentMethod: 'Razorpay Payment Link'
    };

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Award loyalty points (1 point per ₹100 spent)
    const User = require('../models/User');
    const pointsEarned = Math.floor(order.totalAmount / 100);
    const user = await User.findById(req.user._id);
    user.loyaltyPoints += pointsEarned;
    user.totalSpent += order.totalAmount;

    // Update membership tier
    if (user.totalSpent >= 50000) user.membershipTier = 'Platinum';
    else if (user.totalSpent >= 25000) user.membershipTier = 'Gold';
    else if (user.totalSpent >= 10000) user.membershipTier = 'Silver';
    
    await user.save();

    // Clear user cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], totalAmount: 0 }
    );

    await order.save();

    res.json({ message: 'Payment confirmed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
