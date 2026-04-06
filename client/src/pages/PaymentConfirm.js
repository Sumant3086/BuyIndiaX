import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaCheckCircle, FaShippingFast, FaBox } from 'react-icons/fa';
import { fadeInUp } from '../theme/animations';
import './PaymentConfirm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PaymentConfirm = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="payment-confirm-page">
        <div className="container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="payment-confirm-page">
        <div className="container">
          <div className="confirm-card">
            <h1>Order not found</h1>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>
              View All Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-confirm-page">
      <div className="container">
        <motion.div 
          className="confirm-card"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="success-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <FaCheckCircle />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Payment Successful! 🎉
          </motion.h1>

          <motion.p 
            className="success-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Thank you for your order! Your payment has been confirmed.
          </motion.p>

          <motion.div 
            className="order-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="detail-row">
              <span className="label">Order ID:</span>
              <span className="value">#{order._id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Total Amount:</span>
              <span className="value amount">₹{order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Payment Status:</span>
              <span className="value status-paid">Paid ✓</span>
            </div>
            <div className="detail-row">
              <span className="label">Order Status:</span>
              <span className="value status-processing">{order.status}</span>
            </div>
          </motion.div>

          <motion.div 
            className="next-steps"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3><FaShippingFast /> What's Next?</h3>
            <ul>
              <li><FaBox /> Your order is being processed</li>
              <li><FaShippingFast /> You'll receive shipping updates via email</li>
              <li>📧 Order confirmation has been sent to your email</li>
            </ul>
          </motion.div>

          <motion.div 
            className="action-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button 
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/orders')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View My Orders
            </motion.button>
            <motion.button 
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/products')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue Shopping
            </motion.button>
          </motion.div>

          <motion.div 
            className="help-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>Need help? Contact our support team with Order ID: <strong>#{order._id.slice(-8).toUpperCase()}</strong></p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentConfirm;
