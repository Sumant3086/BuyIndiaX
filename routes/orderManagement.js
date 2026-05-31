const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, requirePermission } = require('../middleware/auth');
const InventoryManager = require('../utils/inventoryManager');

// Cancel order (user can cancel if not shipped)
router.post('/:orderId/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check ownership
    if (order.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can only cancel if not shipped
    if (['Shipped', 'Delivered'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel order that has been shipped. Please request a return instead.' 
      });
    }

    // Restore inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    // Refund loyalty points if paid
    if (order.isPaid) {
      const pointsToRefund = Math.floor(order.totalAmount / 100);
      await User.findByIdAndUpdate(userId, {
        $inc: { loyaltyPoints: -pointsToRefund, totalSpent: -order.totalAmount }
      });
    }

    order.status = 'Cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    await order.save();

    // Send notification
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.sendOrderUpdate(
        userId,
        order._id,
        'Cancelled',
        `Your order has been cancelled. ${order.isPaid ? 'Refund will be processed in 5-7 business days.' : ''}`
      );
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request return (after delivery)
router.post('/:orderId/return', auth, async (req, res) => {
  try {
    const { reason, items } = req.body;
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ 
        message: 'Can only request return for delivered orders' 
      });
    }

    // Check return window (30 days)
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (Date.now() - deliveryDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 30) {
      return res.status(400).json({ 
        message: 'Return window has expired. Returns are accepted within 30 days of delivery.' 
      });
    }

    order.returnRequest = {
      status: 'Requested',
      reason,
      items: items || order.items.map(item => item._id),
      requestedAt: new Date()
    };

    await order.save();

    // Send notification
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.sendOrderUpdate(
        userId,
        order._id,
        'Return Requested',
        'Your return request has been submitted. Our team will review it shortly.'
      );
    }

    res.json({ message: 'Return request submitted successfully', order });
  } catch (error) {
    console.error('Return request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Approve return
router.post('/:orderId/return/approve', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const { refundMethod = 'original_payment' } = req.body;

    const order = await Order.findById(req.params.orderId).populate('user');
    
    if (!order || !order.returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    order.returnRequest.status = 'Approved';
    order.returnRequest.approvedAt = new Date();
    order.returnRequest.refundMethod = refundMethod;
    order.status = 'Return Approved';

    await order.save();

    // Send notification
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.sendOrderUpdate(
        order.user._id,
        order._id,
        'Return Approved',
        'Your return has been approved. Please ship the items back to us.'
      );
    }

    res.json({ message: 'Return approved', order });
  } catch (error) {
    console.error('Return approval error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Process refund
router.post('/:orderId/refund', auth, requirePermission('manage_orders'), async (req, res) => {
  try {
    const { amount, method = 'original_payment' } = req.body;

    const order = await Order.findById(req.params.orderId).populate('user');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const refundAmount = amount || order.totalAmount;

    order.refund = {
      amount: refundAmount,
      method,
      processedAt: new Date(),
      status: 'Processed'
    };

    // Restore inventory for returned items
    if (order.returnRequest && order.returnRequest.items) {
      for (const itemId of order.returnRequest.items) {
        const item = order.items.id(itemId);
        if (item) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
          });
        }
      }
    }

    // Refund loyalty points
    const pointsToRefund = Math.floor(refundAmount / 100);
    await User.findByIdAndUpdate(order.user._id, {
      $inc: { loyaltyPoints: -pointsToRefund, totalSpent: -refundAmount }
    });

    order.status = 'Refunded';
    await order.save();

    // Send notification
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.sendOrderUpdate(
        order.user._id,
        order._id,
        'Refunded',
        `Refund of ₹${refundAmount.toLocaleString()} has been processed. It will reflect in your account in 5-7 business days.`
      );
    }

    res.json({ message: 'Refund processed successfully', order });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track order
router.get('/:orderId/track', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const timeline = [
      { status: 'Pending', completed: true, date: order.createdAt },
      { status: 'Processing', completed: order.isPaid, date: order.paidAt },
      { status: 'Shipped', completed: order.status === 'Shipped' || order.status === 'Delivered', date: order.shippedAt },
      { status: 'Delivered', completed: order.status === 'Delivered', date: order.deliveredAt }
    ];

    res.json({
      orderId: order._id,
      currentStatus: order.status,
      timeline,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery
    });
  } catch (error) {
    console.error('Order tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
