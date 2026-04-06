import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaBox, FaUsers, FaShoppingCart, FaChartLine, FaPlus, FaEdit, 
  FaTrash, FaUpload, FaDownload, FaSearch, FaFilter 
} from 'react-icons/fa';
import toast from '../utils/toast';
import { fadeInUp, staggerContainer, staggerItem } from '../theme/animations';
import './EnhancedAdmin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EnhancedAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'customers') fetchUsers();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/orders/admin/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        const productsData = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',');
          const product = {};
          headers.forEach((header, index) => {
            product[header.trim()] = values[index]?.trim();
          });
          productsData.push(product);
        }

        const token = localStorage.getItem('token');
        await axios.post(
          `${API_URL}/products/bulk`,
          { products: productsData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        toast.success(`${productsData.length} products uploaded successfully`);
        fetchProducts();
      } catch (error) {
        toast.error('Failed to upload products');
      }
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Price', 'Stock', 'Category', 'Brand'];
    const rows = products.map(p => [
      p.name,
      p.price,
      p.stock,
      p.category,
      p.brand || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-admin">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <nav className="admin-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartLine /> Dashboard
          </button>
          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            <FaBox /> Products
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            <FaShoppingCart /> Orders
          </button>
          <button
            className={activeTab === 'customers' ? 'active' : ''}
            onClick={() => setActiveTab('customers')}
          >
            <FaUsers /> Customers
          </button>
        </nav>
      </div>

      <div className="admin-content">
        <AnimatePresence mode="wait">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <motion.div
              key="dashboard"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <h1>Dashboard Overview</h1>
              
              <motion.div 
                className="stats-grid"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="stat-card" variants={staggerItem}>
                  <div className="stat-icon" style={{ background: '#3498db' }}>
                    <FaShoppingCart />
                  </div>
                  <div className="stat-info">
                    <h3>{stats.summary.totalOrders}</h3>
                    <p>Total Orders</p>
                  </div>
                </motion.div>

                <motion.div className="stat-card" variants={staggerItem}>
                  <div className="stat-icon" style={{ background: '#2ecc71' }}>
                    <FaBox />
                  </div>
                  <div className="stat-info">
                    <h3>{stats.summary.totalProducts}</h3>
                    <p>Total Products</p>
                  </div>
                </motion.div>

                <motion.div className="stat-card" variants={staggerItem}>
                  <div className="stat-icon" style={{ background: '#9b59b6' }}>
                    <FaUsers />
                  </div>
                  <div className="stat-info">
                    <h3>{stats.summary.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </motion.div>

                <motion.div className="stat-card" variants={staggerItem}>
                  <div className="stat-icon" style={{ background: '#e74c3c' }}>
                    <FaChartLine />
                  </div>
                  <div className="stat-info">
                    <h3>₹{stats.summary.totalRevenue.toLocaleString()}</h3>
                    <p>Total Revenue</p>
                  </div>
                </motion.div>
              </motion.div>

              <div className="dashboard-charts">
                <div className="chart-card">
                  <h3>Orders by Status</h3>
                  <div className="status-bars">
                    {stats.ordersByStatus.map(status => (
                      <div key={status._id} className="status-bar-item">
                        <span className="status-label">{status._id || 'Pending'}</span>
                        <div className="status-bar">
                          <div 
                            className="status-bar-fill"
                            style={{ 
                              width: `${(status.count / stats.summary.totalOrders) * 100}%`,
                              background: getStatusColor(status._id)
                            }}
                          />
                        </div>
                        <span className="status-count">{status.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Recent Orders</h3>
                  <div className="recent-orders-list">
                    {stats.recentOrders.slice(0, 5).map(order => (
                      <div key={order._id} className="recent-order-item">
                        <div>
                          <p className="order-id">#{order._id.slice(-6)}</p>
                          <p className="order-customer">{order.user?.name || 'N/A'}</p>
                        </div>
                        <div className="order-amount">₹{order.totalAmount.toLocaleString()}</div>
                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="tab-header">
                <h1>Products Management</h1>
                <div className="tab-actions">
                  <label className="btn btn-secondary">
                    <FaUpload /> Bulk Upload
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button className="btn btn-secondary" onClick={exportToCSV}>
                    <FaDownload /> Export CSV
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowProductModal(true)}>
                    <FaPlus /> Add Product
                  </button>
                </div>
              </div>

              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <td>
                          <img src={product.image} alt={product.name} className="product-thumb" />
                        </td>
                        <td>{product.name}</td>
                        <td>₹{product.price.toLocaleString()}</td>
                        <td>
                          <span className={`stock-badge ${product.stock < 10 ? 'low' : ''}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td>{product.category}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductModal(true);
                              }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <h1>Orders Management</h1>
              
              <div className="filters-bar">
                <div className="search-box">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-8)}</td>
                        <td>{order.user?.name || 'N/A'}</td>
                        <td>{order.items.length} items</td>
                        <td>₹{order.totalAmount.toLocaleString()}</td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                            className="status-select"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="btn-view">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <motion.div
              key="customers"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <h1>Customers Management</h1>
              
              <div className="customers-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Loyalty Points</th>
                      <th>Tier</th>
                      <th>Total Spent</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.loyaltyPoints || 0}</td>
                        <td>
                          <span className={`tier-badge ${user.membershipTier?.toLowerCase() || 'bronze'}`}>
                            {user.membershipTier || 'Bronze'}
                          </span>
                        </td>
                        <td>₹{(user.totalSpent || 0).toLocaleString()}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    Pending: '#f39c12',
    Processing: '#3498db',
    Shipped: '#9b59b6',
    Delivered: '#2ecc71',
    Cancelled: '#e74c3c'
  };
  return colors[status] || '#95a5a6';
};

export default EnhancedAdmin;
