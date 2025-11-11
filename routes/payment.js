const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Initialize Razorpay only if keys are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const options = {
      amount: order.totalAmount * 100, // amount in paise
      currency: 'INR',
      receipt: order._id.toString()
    };

    const razorpayOrder = await razorpay.orders.create(options);

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

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
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

      // Clear user cart
      await Cart.findOneAndUpdate(
        { user: req.user._id },
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
