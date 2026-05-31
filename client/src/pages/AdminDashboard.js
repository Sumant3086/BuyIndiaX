import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import './AdminDashboard.css';

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
const fmtNum = (v) => new Intl.NumberFormat('en-IN').format(v || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatCard = ({ label, value, sub, accent }) => (
  <div className={`stat-card ${accent ? `stat-${accent}` : ''}`}>
    <span className="stat-label">{label}</span>
    <strong className="stat-value">{value}</strong>
    {sub && <span className="stat-sub">{sub}</span>}
  </div>
);

const Badge = ({ status }) => {
  const map = {
    Pending: 'warning', Processing: 'info', Shipped: 'primary',
    Delivered: 'success', Cancelled: 'danger', Refunded: 'secondary',
    'Return Requested': 'warning', draft: 'default', sent: 'info', received: 'success'
  };
  return <span className={`badge badge-${map[status] || 'default'}`}>{status}</span>;
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'products', label: 'Top Products' },
  { id: 'pos', label: 'POS' }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: null, orders: [], revenueOverview: null,
    revenueTrend: [], inventoryHealth: null, topProducts: [],
    posSummary: null, orderPage: 1, orderTotal: 0
  });
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (tab, page = 1, status = '') => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const [summaryRes, revenueRes, inventoryRes] = await Promise.all([
          api.get('/orders/admin/dashboard'),
          api.get('/finance/revenue/overview?period=30'),
          api.get('/finance/inventory/health')
        ]);
        setData(d => ({
          ...d,
          summary: summaryRes.data,
          revenueOverview: revenueRes.data,
          inventoryHealth: inventoryRes.data
        }));
      } else if (tab === 'orders') {
        const params = new URLSearchParams({ page, limit: 15 });
        if (status) params.set('status', status);
        const res = await api.get(`/orders/admin/all?${params}`);
        setData(d => ({ ...d, orders: res.data.orders || [], orderTotal: res.data.pagination?.totalOrders || 0 }));
      } else if (tab === 'revenue') {
        const [trend, catPerf] = await Promise.all([
          api.get('/finance/revenue/trend?days=30'),
          api.get('/finance/categories/performance?days=30')
        ]);
        setData(d => ({ ...d, revenueTrend: trend.data, categoryPerformance: catPerf.data }));
      } else if (tab === 'inventory') {
        const [health, abcRes] = await Promise.all([
          api.get('/finance/inventory/health'),
          api.get('/finance/inventory/abc?days=90')
        ]);
        setData(d => ({ ...d, inventoryHealth: health.data, abcAnalysis: abcRes.data }));
      } else if (tab === 'products') {
        const res = await api.get('/finance/products/top?days=30&limit=20');
        setData(d => ({ ...d, topProducts: res.data }));
      } else if (tab === 'pos') {
        const res = await api.get('/finance/pos/summary?days=7');
        setData(d => ({ ...d, posSummary: res.data }));
      }
    } catch (err) {
      console.error(`Dashboard load error (${tab}):`, err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(activeTab, orderPage, orderStatus); }, [activeTab, orderPage, orderStatus, load]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/admin/${orderId}/status`, { status: newStatus });
      setMessage(`Order updated to ${newStatus}`);
      load('orders', orderPage, orderStatus);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    }
  };

  const { summary, revenueOverview, inventoryHealth, revenueTrend, categoryPerformance, topProducts, abcAnalysis, posSummary, orders } = data;

  return (
    <div className="admin-dash">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-tabs">
          {TABS.map(t => (
            <button key={t.id} className={activeTab === t.id ? 'active' : ''} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {message && <div className="admin-toast" onClick={() => setMessage('')}>{message}</div>}

      {loading && <div className="admin-loading"><div className="spinner" /></div>}

      {!loading && activeTab === 'overview' && (
        <div className="dash-overview">
          {/* KPI cards */}
          <div className="stat-grid">
            <StatCard label="Total Revenue (All Time)" value={fmt(summary?.summary?.totalRevenue)} accent="green" />
            <StatCard label="Revenue (30d)" value={fmt(revenueOverview?.online?.revenue)} sub={`${revenueOverview?.growth?.revenueGrowthPct > 0 ? '+' : ''}${revenueOverview?.growth?.revenueGrowthPct}% vs prev`} accent={revenueOverview?.growth?.revenueGrowthPct >= 0 ? 'green' : 'red'} />
            <StatCard label="Total Orders" value={fmtNum(summary?.summary?.totalOrders)} />
            <StatCard label="Total Users" value={fmtNum(summary?.summary?.totalUsers)} />
            <StatCard label="Total Products" value={fmtNum(summary?.summary?.totalProducts)} />
            <StatCard label="POS Revenue (30d)" value={fmt(revenueOverview?.pos?.revenue)} sub={`${fmtNum(revenueOverview?.pos?.transactions)} transactions`} />
            <StatCard label="Avg Order Value" value={fmt(revenueOverview?.online?.avgOrderValue)} />
            <StatCard label="Net Revenue (30d)" value={fmt(revenueOverview?.netRevenue)} sub={`After ${fmt(revenueOverview?.refunded)} refunds`} />
          </div>

          {/* Inventory health */}
          {inventoryHealth && (
            <div className="dash-section">
              <h2>Inventory Health</h2>
              <div className="stat-grid">
                <StatCard label="Total Products" value={inventoryHealth.totalProducts} />
                <StatCard label="Out of Stock" value={inventoryHealth.outOfStock} accent="red" />
                <StatCard label="Low Stock" value={inventoryHealth.lowStock} accent="orange" />
                <StatCard label="Expiring ≤30d" value={inventoryHealth.expiringIn30Days} accent="orange" />
                <StatCard label="Inventory Value" value={fmt(inventoryHealth.totalInventoryValue)} accent="green" />
                <StatCard label="Stock Health Score" value={`${inventoryHealth.stockHealthScore}%`} accent={inventoryHealth.stockHealthScore >= 80 ? 'green' : 'orange'} />
              </div>
            </div>
          )}

          {/* Recent orders */}
          <div className="dash-section">
            <h2>Recent Orders</h2>
            <table className="admin-table">
              <thead>
                <tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {(summary?.recentOrders || []).map(o => (
                  <tr key={o._id}>
                    <td><strong>{o.orderNumber || o._id.toString().slice(-6)}</strong></td>
                    <td>{o.user?.name || '—'}</td>
                    <td>{fmt(o.totalAmount)}</td>
                    <td><Badge status={o.status} /></td>
                    <td>{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Orders by status */}
          <div className="dash-section">
            <h2>Order Status Breakdown</h2>
            <div className="status-grid">
              {(summary?.ordersByStatus || []).map(s => (
                <div key={s._id} className="status-card">
                  <Badge status={s._id} /><strong>{s.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'orders' && (
        <div className="dash-orders">
          <div className="orders-toolbar">
            <select value={orderStatus} onChange={e => { setOrderStatus(e.target.value); setOrderPage(1); }}>
              <option value="">All Statuses</option>
              {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>{fmtNum(data.orderTotal)} total orders</span>
          </div>
          <table className="admin-table">
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td><strong>{o.orderNumber || o._id.toString().slice(-6)}</strong></td>
                  <td>
                    <div>{o.user?.name}</div>
                    <div className="text-muted">{o.user?.email}</div>
                  </td>
                  <td>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td>{fmt(o.totalAmount)}</td>
                  <td><Badge status={o.status} /></td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td>
                    <select
                      defaultValue={o.status}
                      onChange={e => updateOrderStatus(o._id, e.target.value)}
                      className="status-select"
                    >
                      {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)}>← Prev</button>
            <span>Page {orderPage} of {Math.ceil(data.orderTotal / 15) || 1}</span>
            <button disabled={orderPage * 15 >= data.orderTotal} onClick={() => setOrderPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {!loading && activeTab === 'revenue' && (
        <div className="dash-section">
          <h2>Revenue Trend (Last 30 Days)</h2>
          {revenueTrend?.length === 0 && <p className="empty-msg">No revenue data available</p>}
          <div className="revenue-bars">
            {(revenueTrend || []).map(d => {
              const max = Math.max(...revenueTrend.map(x => x.totalRevenue), 1);
              return (
                <div key={d.date} className="rev-bar-wrap" title={`${d.date}: ${fmt(d.totalRevenue)}`}>
                  <div className="rev-bar" style={{ height: `${(d.totalRevenue / max) * 100}%` }} />
                  <span className="rev-date">{d.date?.slice(5)}</span>
                </div>
              );
            })}
          </div>

          <h2 style={{ marginTop: 32 }}>Category Performance</h2>
          <table className="admin-table">
            <thead><tr><th>Category</th><th>Revenue</th><th>Units Sold</th><th>Orders</th><th>Avg Price</th></tr></thead>
            <tbody>
              {(categoryPerformance || []).map(c => (
                <tr key={c._id}>
                  <td><strong>{c._id}</strong></td>
                  <td>{fmt(c.revenue)}</td>
                  <td>{fmtNum(c.unitsSold)}</td>
                  <td>{fmtNum(c.orderCount)}</td>
                  <td>{fmt(c.avgPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === 'inventory' && (
        <div>
          {inventoryHealth && (
            <div className="dash-section">
              <h2>Inventory Health Metrics</h2>
              <div className="stat-grid">
                <StatCard label="Total Products" value={inventoryHealth.totalProducts} />
                <StatCard label="Out of Stock" value={inventoryHealth.outOfStock} accent="red" />
                <StatCard label="Low Stock" value={inventoryHealth.lowStock} accent="orange" />
                <StatCard label="Expiring in 30d" value={inventoryHealth.expiringIn30Days} accent="orange" />
                <StatCard label="Expired Batches" value={inventoryHealth.expiredBatches} accent="red" />
                <StatCard label="Total Value" value={fmt(inventoryHealth.totalInventoryValue)} accent="green" />
              </div>
            </div>
          )}
          {abcAnalysis && (
            <div className="dash-section">
              <h2>ABC Analysis (90-day Sales)</h2>
              <div className="abc-summary">
                {['A', 'B', 'C'].map(cls => (
                  <div key={cls} className={`abc-card abc-${cls.toLowerCase()}`}>
                    <h3>Class {cls}</h3>
                    <p>{abcAnalysis.summary[cls]?.count} products</p>
                    <p>{fmt(abcAnalysis.summary[cls]?.revenue)}</p>
                    <small>{cls === 'A' ? 'Top 70% revenue' : cls === 'B' ? '70-90% revenue' : 'Bottom 10%'}</small>
                  </div>
                ))}
              </div>
              <table className="admin-table" style={{ marginTop: 20 }}>
                <thead><tr><th>Class</th><th>Product</th><th>Category</th><th>Revenue</th><th>Units Sold</th><th>Revenue %</th></tr></thead>
                <tbody>
                  {(abcAnalysis.classified || []).slice(0, 30).map((p, i) => (
                    <tr key={i}>
                      <td><span className={`badge badge-${p.class === 'A' ? 'success' : p.class === 'B' ? 'warning' : 'default'}`}>{p.class}</span></td>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>{fmt(p.revenue)}</td>
                      <td>{p.unitsSold}</td>
                      <td>{p.revenuePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'products' && (
        <div className="dash-section">
          <h2>Top Products by Revenue (Last 30 Days)</h2>
          <table className="admin-table">
            <thead><tr><th>#</th><th>Product</th><th>Category</th><th>Revenue</th><th>Units Sold</th><th>Orders</th><th>Current Stock</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i}>
                  <td><strong>{i + 1}</strong></td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{fmt(p.revenue)}</td>
                  <td>{fmtNum(p.unitsSold)}</td>
                  <td>{fmtNum(p.orderCount)}</td>
                  <td className={p.stock <= 10 ? 'text-danger' : ''}>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === 'pos' && posSummary && (
        <div className="dash-section">
          <h2>POS Summary (Last 7 Days)</h2>
          <div className="rev-bars" style={{ height: 160 }}>
            {(posSummary.daily || []).map(d => {
              const max = Math.max(...posSummary.daily.map(x => x.revenue), 1);
              return (
                <div key={d._id} className="rev-bar-wrap" title={`${d._id}: ${fmt(d.revenue)}`}>
                  <div className="rev-bar pos-bar" style={{ height: `${(d.revenue / max) * 100}%` }} />
                  <span className="rev-date">{d._id?.slice(5)}</span>
                </div>
              );
            })}
          </div>

          <div className="stat-grid" style={{ marginTop: 24 }}>
            {(posSummary.paymentMethods || []).map(m => (
              <StatCard key={m._id} label={m._id?.toUpperCase()} value={fmt(m.total)} sub={`${m.count} txns`} />
            ))}
          </div>

          <h3 style={{ marginTop: 24 }}>Top POS Items</h3>
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Revenue</th><th>Units Sold</th></tr></thead>
            <tbody>
              {(posSummary.topItems || []).map((p, i) => (
                <tr key={i}><td>{p.name}</td><td>{fmt(p.revenue)}</td><td>{p.unitsSold}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
