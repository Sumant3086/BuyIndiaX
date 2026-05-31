import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import './POSSystem.css';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

export default function POSSystem() {
  const [session, setSession] = useState(null);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [payments, setPayments] = useState([{ method: 'cash', amount: 0 }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastBill, setLastBill] = useState(null);
  const [activeTab, setActiveTab] = useState('pos');
  const [sessions, setSessions] = useState([]);
  const searchRef = useRef(null);

  // Computed totals
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const totalGST = cart.reduce((sum, item) => sum + (item.gst || 0) * item.quantity, 0);
  const grandTotal = Math.round(subtotal + totalGST);
  const amountPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const change = Math.max(0, amountPaid - grandTotal);

  useEffect(() => {
    fetchCurrentSession();
  }, []);

  const fetchCurrentSession = async () => {
    try {
      const { data } = await api.get('/pos/session/current');
      setSession(data);
    } catch {
      setSession(null);
    }
  };

  const openSession = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/pos/session/open', { openingCash: 0 });
      setSession(data.session);
      setMessage('Session opened successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to open session');
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async () => {
    if (!window.confirm('Close current POS session?')) return;
    try {
      setLoading(true);
      await api.put(`/pos/session/${session._id}/close`, {});
      setSession(null);
      setCart([]);
      setMessage('Session closed');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to close session');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await api.get('/pos/product/lookup', { params: { q: query } });
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(search), 200);
    return () => clearTimeout(timer);
  }, [search, searchProducts]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) {
        return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      const sellingPrice = product.price * (1 - (product.discount || 0) / 100);
      return [...prev, { ...product, quantity: 1, sellingPrice, gst: 0 }];
    });
    setSearch('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i._id !== id));
    } else {
      setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i));
    }
  };

  const updatePayment = (index, field, value) => {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addPaymentMethod = () => {
    setPayments(prev => [...prev, { method: 'upi', amount: 0 }]);
  };

  const completeSale = async () => {
    if (!session) return setMessage('No active session. Open a session first.');
    if (cart.length === 0) return setMessage('Cart is empty');
    if (amountPaid < grandTotal) return setMessage(`Insufficient payment. Need ₹${grandTotal - amountPaid} more.`);

    try {
      setLoading(true);
      const { data } = await api.post('/pos/sale', {
        sessionId: session._id,
        items: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
        payments: payments.map(p => ({ ...p, amount: parseFloat(p.amount) })),
        customerPhone,
        grandTotal
      });

      setLastBill(data);
      setCart([]);
      setPayments([{ method: 'cash', amount: 0 }]);
      setCustomerPhone('');
      setMessage(`Sale complete! Bill: ${data.billNumber} | Change: ${formatCurrency(data.changeReturned)}`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Sale failed');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    if (cart.length === 0 || window.confirm('Clear cart?')) {
      setCart([]);
      setPayments([{ method: 'cash', amount: 0 }]);
    }
  };

  if (!session) {
    return (
      <div className="pos-landing">
        <div className="pos-landing-card">
          <h1>BuyIndiaX POS</h1>
          <p>No active session. Open a session to start billing.</p>
          <button className="btn-primary" onClick={openSession} disabled={loading}>
            {loading ? 'Opening...' : 'Open POS Session'}
          </button>
          {message && <p className="pos-message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="pos-system">
      {/* Header */}
      <div className="pos-header">
        <div className="pos-header-left">
          <span className="pos-logo">BuyIndiaX POS</span>
          <span className="pos-session-info">
            Session: {session.sessionNumber} | Cashier: {session.cashier?.name || 'You'}
          </span>
        </div>
        <div className="pos-tabs">
          {['pos', 'bills', 'summary'].map(tab => (
            <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="btn-close-session" onClick={closeSession}>Close Session</button>
      </div>

      {message && (
        <div className="pos-toast" onClick={() => setMessage('')}>{message}</div>
      )}

      {activeTab === 'pos' && (
        <div className="pos-main">
          {/* Left: Product search + cart */}
          <div className="pos-left">
            <div className="pos-search-bar">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search product or scan barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pos-search-input"
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="pos-search-dropdown">
                  {searchResults.map(p => (
                    <div key={p._id} className="pos-search-item" onClick={() => addToCart(p)}>
                      <span className="pos-product-name">{p.name}</span>
                      <span className="pos-product-price">{formatCurrency(p.price)}</span>
                      <span className="pos-product-stock">Stock: {p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="pos-cart">
              <div className="pos-cart-header">
                <span>CART ({cart.length} items)</span>
                <button className="btn-clear" onClick={clearCart}>CLEAR</button>
              </div>
              {cart.length === 0 ? (
                <div className="pos-cart-empty">Scan or search a product to add</div>
              ) : (
                <div className="pos-cart-items">
                  {cart.map(item => (
                    <div key={item._id} className="pos-cart-item">
                      <div className="pos-item-info">
                        <span className="pos-item-name">{item.name}</span>
                        <span className="pos-item-price">{formatCurrency(item.sellingPrice)}</span>
                      </div>
                      <div className="pos-item-controls">
                        <button onClick={() => updateQty(item._id, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQty(item._id, item.quantity + 1)}>+</button>
                        <span className="pos-item-total">{formatCurrency(item.sellingPrice * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Bill summary + payment */}
          <div className="pos-right">
            <div className="pos-customer">
              <input
                type="tel"
                placeholder="Customer phone (optional)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="pos-totals">
              <div className="pos-total-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="pos-total-row"><span>GST</span><span>{formatCurrency(totalGST)}</span></div>
              <div className="pos-total-row pos-grand-total"><span>TOTAL</span><span>{formatCurrency(grandTotal)}</span></div>
            </div>

            <div className="pos-payment-section">
              <h3>PAYMENT</h3>
              {payments.map((p, i) => (
                <div key={i} className="pos-payment-row">
                  <select value={p.method} onChange={e => updatePayment(i, 'method', e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="wallet">Wallet</option>
                    <option value="store_credit">Store Credit</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={p.amount}
                    onChange={e => updatePayment(i, 'amount', e.target.value)}
                    min="0"
                  />
                </div>
              ))}
              <button className="btn-add-payment" onClick={addPaymentMethod}>+ Add Payment Method</button>

              <div className="pos-payment-summary">
                <div><span>Paid</span><span>{formatCurrency(amountPaid)}</span></div>
                <div className={change > 0 ? 'pos-change' : ''}><span>Change</span><span>{formatCurrency(change)}</span></div>
              </div>
            </div>

            <button
              className="btn-complete-sale"
              onClick={completeSale}
              disabled={loading || cart.length === 0 || amountPaid < grandTotal}
            >
              {loading ? 'Processing...' : `COMPLETE SALE — ${formatCurrency(grandTotal)}`}
            </button>

            {lastBill && (
              <div className="pos-last-bill">
                <strong>Last Bill:</strong> {lastBill.billNumber} — {formatCurrency(lastBill.grandTotal)}
                <button onClick={() => window.print()}>Print</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="pos-summary">
          <h2>Session Summary</h2>
          <div className="pos-summary-grid">
            <div className="pos-summary-card">
              <span>Total Sales</span>
              <strong>{formatCurrency(session.summary?.totalSales)}</strong>
            </div>
            <div className="pos-summary-card">
              <span>Transactions</span>
              <strong>{session.summary?.totalTransactions || 0}</strong>
            </div>
            <div className="pos-summary-card">
              <span>Cash</span>
              <strong>{formatCurrency(session.summary?.totalCashSales)}</strong>
            </div>
            <div className="pos-summary-card">
              <span>UPI</span>
              <strong>{formatCurrency(session.summary?.totalUPISales)}</strong>
            </div>
            <div className="pos-summary-card">
              <span>Card</span>
              <strong>{formatCurrency(session.summary?.totalCardSales)}</strong>
            </div>
            <div className="pos-summary-card">
              <span>Total GST</span>
              <strong>{formatCurrency(session.summary?.totalGST)}</strong>
            </div>
            <div className="pos-summary-card">
              <span>Items Sold</span>
              <strong>{session.summary?.itemsSold || 0}</strong>
            </div>
            <div className="pos-summary-card">
              <span>Discounts Given</span>
              <strong>{formatCurrency(session.summary?.totalDiscount)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
