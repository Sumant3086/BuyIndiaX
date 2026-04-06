import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import SearchAutocomplete from './SearchAutocomplete';
import './Navbar.css';

const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsSidebarOpen(false);
    setIsUserMenuOpen(false);
  };

  // Ensure cart is properly loaded
  const cartItemsCount = cart?.items?.filter(item => item?.product)?.length || 0;

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <>
      <motion.nav 
        className="navbar-alt"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        <div className="navbar-wrapper">
          {/* Left Section */}
          <div className="navbar-section navbar-left-section">
            <button 
              className="menu-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Menu"
            >
              <span className="menu-icon">☰</span>
            </button>

            <Link to="/" className="brand-logo">
              <motion.span 
                className="logo-icon"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                🛍️
              </motion.span>
              <span className="logo-text">BuyIndiaX</span>
            </Link>

            <div className="desktop-nav-links">
              <Link to="/" className="nav-item">Home</Link>
              <Link to="/products" className="nav-item">Products</Link>
              {user && <Link to="/orders" className="nav-item">Orders</Link>}
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="navbar-section navbar-center-section">
            <SearchAutocomplete />
          </div>

          {/* Right Section */}
          <div className="navbar-section navbar-right-section">
            {user ? (
              <>
                <Link to="/wishlist" className="icon-link" title="Wishlist">
                  <motion.span
                    className="icon"
                    whileHover={{ scale: 1.2 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ❤️
                  </motion.span>
                </Link>

                <NotificationCenter />

                <Link to="/cart" className="icon-link cart-link" title="Cart">
                  <span className="icon">🛒</span>
                  <AnimatePresence>
                    {cartItemsCount > 0 && (
                      <motion.span 
                        className="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        {cartItemsCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                <ThemeToggle />

                <div className="user-menu-wrapper">
                  <button 
                    className="user-profile"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="user-avatar">👤</span>
                    <span className="user-text">{user.name}</span>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <>
                        <motion.div 
                          className="user-menu-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <motion.div
                          className="user-dropdown-menu"
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="user-dropdown-header">
                            <div className="user-dropdown-avatar">👤</div>
                            <div className="user-dropdown-info">
                              <p className="user-dropdown-name">{user.name}</p>
                              <p className="user-dropdown-email">{user.email}</p>
                            </div>
                          </div>
                          <div className="user-dropdown-divider"></div>
                          <Link 
                            to="/orders" 
                            className="user-dropdown-item"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="dropdown-item-icon">📦</span>
                            <span>My Orders</span>
                          </Link>
                          <Link 
                            to="/wishlist" 
                            className="user-dropdown-item"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="dropdown-item-icon">❤️</span>
                            <span>Wishlist</span>
                          </Link>
                          {user.role === 'admin' && (
                            <Link 
                              to="/admin" 
                              className="user-dropdown-item admin"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <span className="dropdown-item-icon">⚙️</span>
                              <span>Admin Panel</span>
                            </Link>
                          )}
                          <div className="user-dropdown-divider"></div>
                          <button 
                            className="user-dropdown-item logout"
                            onClick={handleLogout}
                          >
                            <span className="dropdown-item-icon">🚪</span>
                            <span>Logout</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link to="/login" className="btn-link">Login</Link>
                <Link to="/register" className="btn-signup">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
            />
            <motion.aside 
              className="sidebar"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="sidebar-header">
                <h2 className="sidebar-title">Menu</h2>
                <button className="close-btn" onClick={closeSidebar}>✕</button>
              </div>

              <div className="sidebar-content">
                {user && (
                  <div className="sidebar-user">
                    <div className="sidebar-user-avatar">👤</div>
                    <div className="sidebar-user-info">
                      <p className="sidebar-user-name">{user.name}</p>
                      <p className="sidebar-user-email">{user.email}</p>
                    </div>
                  </div>
                )}

                <div className="sidebar-section">
                  <h3 className="sidebar-section-title">Navigation</h3>
                  <Link to="/" className="sidebar-link" onClick={closeSidebar}>
                    <span className="sidebar-link-icon">🏠</span>
                    <span>Home</span>
                  </Link>
                  <Link to="/products" className="sidebar-link" onClick={closeSidebar}>
                    <span className="sidebar-link-icon">🛍️</span>
                    <span>Products</span>
                  </Link>
                  {user && (
                    <>
                      <Link to="/orders" className="sidebar-link" onClick={closeSidebar}>
                        <span className="sidebar-link-icon">📦</span>
                        <span>My Orders</span>
                      </Link>
                      <Link to="/wishlist" className="sidebar-link" onClick={closeSidebar}>
                        <span className="sidebar-link-icon">❤️</span>
                        <span>Wishlist</span>
                      </Link>
                      <Link to="/cart" className="sidebar-link" onClick={closeSidebar}>
                        <span className="sidebar-link-icon">🛒</span>
                        <span>Cart</span>
                        {cartItemsCount > 0 && (
                          <span className="sidebar-badge">{cartItemsCount}</span>
                        )}
                      </Link>
                    </>
                  )}
                </div>

                {user?.role === 'admin' && (
                  <div className="sidebar-section">
                    <h3 className="sidebar-section-title">Admin</h3>
                    <Link to="/admin" className="sidebar-link admin" onClick={closeSidebar}>
                      <span className="sidebar-link-icon">⚙️</span>
                      <span>Admin Panel</span>
                    </Link>
                  </div>
                )}

                {user ? (
                  <div className="sidebar-section">
                    <button className="sidebar-link logout" onClick={handleLogout}>
                      <span className="sidebar-link-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="sidebar-section">
                    <Link to="/login" className="sidebar-link" onClick={closeSidebar}>
                      <span className="sidebar-link-icon">🔐</span>
                      <span>Login</span>
                    </Link>
                    <Link to="/register" className="sidebar-link" onClick={closeSidebar}>
                      <span className="sidebar-link-icon">✨</span>
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
