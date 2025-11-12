import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import PaymentConfirm from './pages/PaymentConfirm';
import Wishlist from './pages/Wishlist';
import PrivateRoute from './components/PrivateRoute';
import TrustBadges from './components/TrustBadges';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
                <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
                <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                <Route path="/payment-confirm/:orderId" element={<PrivateRoute><PaymentConfirm /></PrivateRoute>} />
              </Routes>
              <TrustBadges />
            </main>
            <ScrollToTop />
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
