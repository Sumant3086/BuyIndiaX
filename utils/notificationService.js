const Notification = require('../models/Notification');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async sendToUser(userId, notification) {
    try {
      const newNotification = await Notification.create({ user: userId, ...notification });
      this.io.to(`user-${userId}`).emit('notification', {
        _id: newNotification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: newNotification.createdAt
      });
      return newNotification;
    } catch (error) {
      // Never let notification failure crash the caller
      console.error('Notification error:', error.message);
    }
  }

  async sendOrderUpdate(userId, orderId, status, message) {
    const orderId6 = orderId?.toString().slice(-6);
    return this.sendToUser(userId, {
      type: 'order',
      title: 'Order Update',
      message: message || `Your order #${orderId6} is now ${status}`,
      relatedId: orderId
    });
  }

  async sendPaymentConfirmation(userId, orderId, amount) {
    return this.sendToUser(userId, {
      type: 'payment',
      title: 'Payment Successful',
      message: `Payment of ₹${amount?.toLocaleString('en-IN')} received for order #${orderId?.toString().slice(-6)}`,
      relatedId: orderId
    });
  }

  // Fixed: was querying isAdmin:true which doesn't exist on User model
  async sendLowStockAlert(productId, productName, stock) {
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    for (const admin of admins) {
      await this.sendToUser(admin._id, {
        type: 'alert',
        title: 'Low Stock Alert',
        message: `${productName} is running low (${stock} left)`,
        relatedId: productId
      });
    }
  }

  async sendPromotion(userId, title, message) {
    return this.sendToUser(userId, { type: 'promotion', title, message });
  }

  async sendWelcome(userId, userName) {
    return this.sendToUser(userId, {
      type: 'info',
      title: 'Welcome to BuyIndiaX!',
      message: `Hi ${userName}! Thanks for joining. Enjoy shopping!`
    });
  }

  async sendCartReminder(userId, cartItemCount) {
    return this.sendToUser(userId, {
      type: 'reminder',
      title: 'Items in Your Cart',
      message: `You have ${cartItemCount} item(s) waiting in your cart!`
    });
  }

  broadcast(notification) {
    this.io.emit('notification', notification);
  }
}

module.exports = NotificationService;
