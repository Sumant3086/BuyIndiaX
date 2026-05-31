import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { queryClient } from './lib/queryClient';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// ── Eagerly loaded (critical first-paint path) ────────────────────────────────
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// ── Lazy loaded — customer routes ─────────────────────────────────────────────
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const PaymentConfirm = lazy(() => import('./pages/PaymentConfirm'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Comparison = lazy(() => import('./pages/Comparison'));

// ── Admin chunks — never sent to regular customers ────────────────────────────
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const POSSystem = lazy(() => import('./pages/POSSystem'));
const InventoryDashboard = lazy(() => import('./pages/InventoryDashboard'));

// ── Heavy optional widgets ────────────────────────────────────────────────────
const AIChatbot = lazy(() => import('./components/AIChatbot'));

const isDev = process.env.NODE_ENV === 'development';

// Minimal page-level loading fallback
const PageLoader = () => (
  <div role="status" aria-label="Loading page" style={{
    display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'
  }}>
    <div style={{
      width: 32, height: 32,
      border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite'
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <div className="App">
                <a href="#main-content" className="skip-link">Skip to main content</a>
                <Navbar />
                <main id="main-content" className="main-content">
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Eagerly loaded */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Lazy — public */}
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/comparison" element={<Comparison />} />

                        {/* Lazy — auth-gated customer */}
                        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
                        <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
                        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                        <Route path="/payment-confirm/:orderId" element={<PrivateRoute><PaymentConfirm /></PrivateRoute>} />

                        {/* Admin — separate chunk, never loaded by customers */}
                        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/pos" element={<AdminRoute><POSSystem /></AdminRoute>} />
                        <Route path="/inventory" element={<AdminRoute><InventoryDashboard /></AdminRoute>} />

                        {/* 404 — always last */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </main>
                <ScrollToTop />
                <Suspense fallback={null}><AIChatbot /></Suspense>
                <Footer />
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>

      {isDev && (
        <Suspense fallback={null}>
          {React.createElement(
            lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools }))),
            { initialIsOpen: false }
          )}
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

export default App;
