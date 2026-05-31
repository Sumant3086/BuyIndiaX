import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './InventoryDashboard.css';

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v || 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lowStock, setLowStock] = useState([]);
  const [expired, setExpired] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [batches, setBatches] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [batchForm, setBatchForm] = useState({ quantity: '', costPrice: '', expiryDate: '', batchNumber: '', supplier: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [lowStockRes, valuationRes, poRes] = await Promise.all([
        api.get('/inventory/low-stock'),
        api.get('/inventory/valuation'),
        api.get('/purchase-orders?limit=10')
      ]);
      setLowStock(lowStockRes.data.products || []);
      setValuation(valuationRes.data);
      setPurchaseOrders(poRes.data.orders || []);
    } catch (err) {
      console.error('Inventory fetch error:', err.message);
    }
    setLoading(false);
  };

  const fetchExpired = async () => {
    try {
      const { data } = await api.get('/inventory/expired');
      setExpired(data.expiredItems || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'expiry') fetchExpired();
  }, [activeTab]);

  const addBatch = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return setMessage('Select a product');
    try {
      await api.post('/inventory/batch/add', {
        productId: selectedProduct,
        batchData: { ...batchForm, quantity: parseInt(batchForm.quantity), costPrice: parseFloat(batchForm.costPrice) }
      });
      setMessage('Batch added successfully');
      setShowAddBatch(false);
      setBatchForm({ quantity: '', costPrice: '', expiryDate: '', batchNumber: '', supplier: '' });
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to add batch');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'low-stock', label: `Low Stock (${lowStock.length})` },
    { id: 'expiry', label: 'Expiry Tracking' },
    { id: 'purchase-orders', label: 'Purchase Orders' },
    { id: 'valuation', label: 'Valuation' }
  ];

  if (loading) return <div className="inv-loading">Loading inventory data...</div>;

  return (
    <div className="inv-dashboard">
      <div className="inv-header">
        <h1>Inventory Management</h1>
        <button className="btn-add-batch" onClick={() => setShowAddBatch(true)}>+ Add Stock Batch</button>
      </div>

      {message && <div className="inv-message" onClick={() => setMessage('')}>{message}</div>}

      {/* Quick stats */}
      <div className="inv-stats">
        <div className="inv-stat-card">
          <span>Total Products</span>
          <strong>{valuation?.products?.length || 0}</strong>
        </div>
        <div className="inv-stat-card inv-stat-warning">
          <span>Low Stock Items</span>
          <strong>{lowStock.length}</strong>
        </div>
        <div className="inv-stat-card inv-stat-danger">
          <span>Expired Items</span>
          <strong>{expired.length}</strong>
        </div>
        <div className="inv-stat-card">
          <span>Inventory Value</span>
          <strong>{formatCurrency(valuation?.totalValue)}</strong>
        </div>
        <div className="inv-stat-card">
          <span>Pending POs</span>
          <strong>{purchaseOrders.filter(o => ['draft', 'sent'].includes(o.status)).length}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="inv-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="inv-content">
        {activeTab === 'overview' && (
          <div>
            <h2>Low Stock Alerts</h2>
            {lowStock.slice(0, 5).map(p => (
              <div key={p._id} className="inv-alert-row">
                <span className="inv-alert-name">{p.name}</span>
                <span className="inv-alert-category">{p.category}</span>
                <span className="inv-alert-stock inv-low">Stock: {p.stock}</span>
                <span className="inv-alert-threshold">Min: {p.lowStockThreshold}</span>
              </div>
            ))}
            {lowStock.length > 5 && (
              <button className="btn-view-all" onClick={() => setActiveTab('low-stock')}>
                View all {lowStock.length} low stock items →
              </button>
            )}
          </div>
        )}

        {activeTab === 'low-stock' && (
          <div>
            <h2>Low Stock Products ({lowStock.length})</h2>
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(product => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td className={product.stock === 0 ? 'inv-zero' : 'inv-low'}>{product.stock}</td>
                    <td>{product.lowStockThreshold}</td>
                    <td>
                      <span className={`inv-badge ${product.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-sm"
                        onClick={() => { setSelectedProduct(product._id); setShowAddBatch(true); }}
                      >
                        Add Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'expiry' && (
          <div>
            <h2>Expired Batches</h2>
            {expired.length === 0 ? (
              <p className="inv-empty">No expired batches found</p>
            ) : (
              expired.map(item => (
                <div key={item.productId} className="inv-expiry-item">
                  <strong>{item.productName}</strong>
                  <div className="inv-expired-batches">
                    {item.expiredBatches.map((b, i) => (
                      <div key={i} className="inv-batch-row">
                        <span>Batch: {b.batchNumber}</span>
                        <span>Qty: {b.quantity}</span>
                        <span className="inv-expired-date">Expired: {formatDate(b.expiryDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'purchase-orders' && (
          <div>
            <h2>Recent Purchase Orders</h2>
            <table className="inv-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Expected Delivery</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po._id}>
                    <td><strong>{po.poNumber}</strong></td>
                    <td>{po.supplier?.name || '—'}</td>
                    <td>{formatCurrency(po.totalAmount)}</td>
                    <td>
                      <span className={`inv-badge badge-${
                        po.status === 'received' ? 'success' :
                        po.status === 'cancelled' ? 'danger' :
                        po.status === 'sent' ? 'info' : 'default'
                      }`}>{po.status}</span>
                    </td>
                    <td>{formatDate(po.orderDate)}</td>
                    <td>{formatDate(po.expectedDeliveryDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'valuation' && (
          <div>
            <h2>Inventory Valuation</h2>
            <div className="inv-valuation-total">
              Total Inventory Value: <strong>{formatCurrency(valuation?.totalValue)}</strong>
            </div>
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total Qty</th>
                  <th>Value (₹)</th>
                  <th>Batches</th>
                </tr>
              </thead>
              <tbody>
                {(valuation?.products || []).map(p => (
                  <tr key={p.productId}>
                    <td>{p.productName}</td>
                    <td>{p.totalQuantity}</td>
                    <td>{formatCurrency(p.value)}</td>
                    <td>{p.batches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Batch Modal */}
      {showAddBatch && (
        <div className="inv-modal-overlay" onClick={() => setShowAddBatch(false)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Stock Batch</h3>
            <form onSubmit={addBatch}>
              <div className="inv-form-group">
                <label>Product ID</label>
                <input
                  type="text"
                  placeholder="Product ID"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  required
                />
              </div>
              <div className="inv-form-group">
                <label>Batch Number</label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-2024-001"
                  value={batchForm.batchNumber}
                  onChange={e => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                />
              </div>
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Quantity *</label>
                  <input type="number" min="1" value={batchForm.quantity}
                    onChange={e => setBatchForm({ ...batchForm, quantity: e.target.value })} required />
                </div>
                <div className="inv-form-group">
                  <label>Cost Price (₹) *</label>
                  <input type="number" min="0" step="0.01" value={batchForm.costPrice}
                    onChange={e => setBatchForm({ ...batchForm, costPrice: e.target.value })} required />
                </div>
              </div>
              <div className="inv-form-group">
                <label>Expiry Date</label>
                <input type="date" value={batchForm.expiryDate}
                  onChange={e => setBatchForm({ ...batchForm, expiryDate: e.target.value })} />
              </div>
              <div className="inv-form-group">
                <label>Supplier</label>
                <input type="text" placeholder="Supplier name" value={batchForm.supplier}
                  onChange={e => setBatchForm({ ...batchForm, supplier: e.target.value })} />
              </div>
              <div className="inv-modal-actions">
                <button type="button" onClick={() => setShowAddBatch(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save">Add Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
