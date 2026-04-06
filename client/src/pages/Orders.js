import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import OrderTimeline from '../components/OrderTimeline';
import { fadeInUp, staggerContainer, staggerItem } from '../theme/animations';
import './Orders.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchUserStats();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(response.data.user);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'warning',
      Processing: 'info',
      Shipped: 'primary',
      Delivered: 'success',
      Cancelled: 'danger'
    };
    return colors[status] || 'secondary';
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="empty-orders">
        <div className="container">
          <div className="empty-content">
            <span className="empty-icon">📦</span>
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here!</p>
            <a href="/products" className="btn btn-primary">Browse Products</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <motion.h1 
          className="page-title"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          My Orders 📦
        </motion.h1>

        {userStats && (
          <motion.div 
            className="loyalty-card"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <div className="loyalty-info">
              <div className="loyalty-item">
                <span className="loyalty-icon">⭐</span>
                <div>
                  <p className="loyalty-label">Loyalty Points</p>
                  <p className="loyalty-value">{userStats.loyaltyPoints || 0}</p>
                </div>
              </div>
              <div className="loyalty-item">
                <span className="loyalty-icon">👑</span>
                <div>
                  <p className="loyalty-label">Membership Tier</p>
                  <p className="loyalty-value">{userStats.membershipTier || 'Bronze'}</p>
                </div>
              </div>
              <div className="loyalty-item">
                <span className="loyalty-icon">💰</span>
                <div>
                  <p className="loyalty-label">Total Spent</p>
                  <p className="loyalty-value">₹{(userStats.totalSpent || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <p className="loyalty-note">💡 Earn 1 point for every ₹100 spent!</p>
          </motion.div>
        )}

        <motion.div 
          className="orders-list"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {orders.map((order) => (
            <motion.div 
              key={order._id} 
              className="order-card"
              variants={staggerItem}
              whileHover={{ y: -4 }}
            >
              <div className="order-header">
                <div>
                  <p className="order-id">Order #{order._id.slice(-8)}</p>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`badge badge-${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="order-item-info">
                      <p className="item-name">{item.name}</p>
                      <p className="item-qty">Quantity: {item.quantity}</p>
                    </div>
                    <p className="item-price">₹{item.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-address">
                  <p><strong>Shipping Address:</strong></p>
                  <p>{order.shippingAddress.street}, {order.shippingAddress.city}</p>
                  <p>{order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                </div>
                <div className="order-total">
                  <p className="total-label">Total Amount</p>
                  <p className="total-amount">₹{order.totalAmount.toLocaleString()}</p>
                  {order.isPaid && (
                    <span className="paid-badge">✓ Paid</span>
                  )}
                </div>
              </div>

              <motion.button
                className="btn btn-primary track-btn"
                onClick={() => setSelectedOrder(order)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Track Order 📍
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Order Timeline Modal */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              className="timeline-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                className="timeline-modal"
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="modal-close"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </button>
                <OrderTimeline order={selectedOrder} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Orders;
