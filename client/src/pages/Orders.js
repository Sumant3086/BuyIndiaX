import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Orders.css';

const API_URL = 'http://localhost:5000/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);

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
        <h1 className="page-title">My Orders 📦</h1>

        {userStats && (
          <div className="loyalty-card">
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
          </div>
        )}

        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
