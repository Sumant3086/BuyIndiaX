import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemsCount = cart?.items?.length || 0;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">🛍️</span>
            <span className="brand-text">BuyIndiaX</span>
          </Link>

          <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/products" className="nav-link" onClick={() => setIsOpen(false)}>Products</Link>
            
            {user ? (
              <>
                <Link to="/orders" className="nav-link" onClick={() => setIsOpen(false)}>Orders</Link>
                <Link to="/wishlist" className="nav-link" onClick={() => setIsOpen(false)}>
                  <span>❤️</span>
                </Link>
                <Link to="/cart" className="nav-link cart-link" onClick={() => setIsOpen(false)}>
                  <span className="cart-icon">🛒</span>
                  {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
                </Link>
                <div className="nav-user">
                  <span className="user-name">👤 {user.name}</span>
                  <button onClick={handleLogout} className="btn btn-logout">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={() => setIsOpen(false)}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setIsOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
