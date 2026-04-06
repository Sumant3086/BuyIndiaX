const Notification = require('../models/Notification');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Send real-time notification to specific user
  async sendToUser(userId, notification) {
    try {
      // Save to database
      const newNotification = await Notification.create({
        user: userId,
        ...notification
      });

      // Send via Socket.IO
      this.io.to(`user-${userId}`).emit('notification', {
        _id: newNotification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: newNotification.createdAt
      });

      return newNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send order status update
  async sendOrderUpdate(userId, orderId, status, message) {
    return this.sendToUser(userId, {
      type: 'order',
      title: 'Order Update',
      message: message || `Your order #${orderId.slice(-6)} is now ${status}`,
      relatedId: orderId
    });
  }

  // Send payment confirmation
  async sendPaymentConfirmation(userId, orderId, amount) {
    return this.sendToUser(userId, {
      type: 'payment',
      title: 'Payment Successful',
      message: `Payment of ₹${amount.toLocaleString()} received for order #${orderId.slice(-6)}`,
      relatedId: orderId
    });
  }

  // Send low stock alert to admin
  async sendLowStockAlert(productId, productName, stock) {
    // Get all admin users
    const User = require('../models/User');
    const admins = await User.find({ isAdmin: true });

    for (const admin of admins) {
      await this.sendToUser(admin._id, {
        type: 'alert',
        title: 'Low Stock Alert',
        message: `${productName} is running low (${stock} left)`,
        relatedId: productId
      });
    }
  }

  // Send promotional notification
  async sendPromotion(userId, title, message) {
    return this.sendToUser(userId, {
      type: 'promotion',
      title,
      message
    });
  }

  // Broadcast to all connected users
  async broadcast(notification) {
    this.io.emit('notification', notification);
  }

  // Send welcome notification to new user
  async sendWelcome(userId, userName) {
    return this.sendToUser(userId, {
      type: 'info',
      title: 'Welcome to BuyIndiaX!',
      message: `Hi ${userName}! Thanks for joining us. Enjoy shopping!`
    });
  }

  // Send abandoned cart reminder
  async sendCartReminder(userId, cartItems) {
    return this.sendToUser(userId, {
      type: 'reminder',
      title: 'Items in Your Cart',
      message: `You have ${cartItems} item(s) waiting in your cart. Complete your purchase now!`
    });
  }
}

module.exports = NotificationService;
