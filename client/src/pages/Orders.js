import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import SEOMeta from '../components/SEOMeta';
import { OrderCardSkeleton } from '../components/LoadingSkeleton';
import OrderTimeline from '../components/OrderTimeline';
import './Orders.css';

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_COLORS = {
  Pending: 'warning', Processing: 'info', Shipped: 'primary',
  Delivered: 'success', Cancelled: 'danger', Refunded: 'secondary'
};

const Orders = () => {
  useDocumentTitle('My Orders');
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get('/orders')
      .then(res => {
        // API returns { orders, total } or just an array (backward compat)
        const data = Array.isArray(res.data) ? res.data : (res.data.orders || []);
        setOrders(data);
      })
      .catch(() => setError('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!filterStatus) return orders;
    return orders.filter(o => o.status === filterStatus);
  }, [orders, filterStatus]);

  const stats = useMemo(() => ({
    total: orders.length,
    totalSpent: orders.filter(o => o.isPaid).reduce((s, o) => s + o.totalAmount, 0),
    delivered: orders.filter(o => o.status === 'Delivered').length,
    active: orders.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length
  }), [orders]);

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <h1 className="page-title">My Orders</h1>
          <div className="orders-list">
            {Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="orders-error">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <SEOMeta title="My Orders" />
        <div className="orders-page">
          <div className="container">
            <div className="empty-orders">
              <span className="empty-icon" aria-hidden="true">📦</span>
              <h2>No orders yet</h2>
              <p>Your orders will appear here once you start shopping.</p>
              <Link to="/products" className="btn btn-primary">Browse Products</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOMeta title="My Orders" description="View and track all your BuyIndiaX orders." />
      <div className="orders-page">
        <div className="container">
          <h1 className="page-title">My Orders</h1>

          {/* Stats row */}
          <div className="orders-stats">
            <div className="stat"><strong>{stats.total}</strong><span>Total Orders</span></div>
            <div className="stat"><strong>{stats.delivered}</strong><span>Delivered</span></div>
            <div className="stat"><strong>{stats.active}</strong><span>In Progress</span></div>
            <div className="stat"><strong>{fmt(stats.totalSpent)}</strong><span>Total Spent</span></div>
          </div>

          {/* Filter */}
          <div className="orders-filter">
            {['', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
              <button
                key={s || 'all'}
                className={`filter-btn ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {/* Orders list */}
          <div className="orders-list">
            {filtered.map(order => (
              <article key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-meta">
                    <span className="order-number">
                      #{order.orderNumber || order._id.toString().slice(-8).toUpperCase()}
                    </span>
                    <time className="order-date" dateTime={order.createdAt}>
                      {fmtDate(order.createdAt)}
                    </time>
                  </div>
                  <span className={`order-status status-${STATUS_COLORS[order.status] || 'secondary'}`}>
                    {order.status}
                  </span>
                </div>

                <div className="order-items-preview">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <div key={i} className="order-item-chip">
                      {item.product?.image && (
                        <img
                          src={item.product.image}
                          alt={item.name}
                          loading="lazy"
                          className="chip-image"
                        />
                      )}
                      <span className="chip-name">{item.name}</span>
                      <span className="chip-qty">×{item.quantity}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <span className="more-items">+{order.items.length - 3} more</span>
                  )}
                </div>

                <div className="order-footer">
                  <span className="order-total">{fmt(order.totalAmount)}</span>
                  <div className="order-actions">
                    {order.trackingNumber && (
                      <span className="tracking-number" title={`Tracking: ${order.trackingNumber}`}>
                        📦 {order.trackingNumber}
                      </span>
                    )}
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                      aria-expanded={selectedOrder?._id === order._id}
                    >
                      {selectedOrder?._id === order._id ? 'Close' : 'Details'}
                    </button>
                  </div>
                </div>

                {selectedOrder?._id === order._id && (
                  <div className="order-detail-expanded">
                    <OrderTimeline order={order} />
                    <div className="order-items-full">
                      {order.items?.map((item, i) => (
                        <div key={i} className="order-item-row">
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">×{item.quantity}</span>
                          <span className="item-price">{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="order-item-row order-item-total">
                        <strong>Total</strong>
                        <span />
                        <strong>{fmt(order.totalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Orders;
