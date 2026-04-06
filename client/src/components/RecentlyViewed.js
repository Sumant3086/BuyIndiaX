import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaTimes, FaEye } from 'react-icons/fa';
import { fadeInRight, staggerContainer, staggerItem } from '../theme/animations';
import './RecentlyViewed.css';

const RecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Load recently viewed products from localStorage
    const loadRecentProducts = () => {
      const stored = localStorage.getItem('recentlyViewed');
      if (stored) {
        try {
          const products = JSON.parse(stored);
          setRecentProducts(products.slice(0, 5)); // Show last 5 products
        } catch (error) {
          console.error('Error loading recently viewed:', error);
        }
      }
    };

    loadRecentProducts();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadRecentProducts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('recentlyViewedUpdate', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('recentlyViewedUpdate', handleStorageChange);
    };
  }, []);

  if (recentProducts.length === 0 || !isVisible) {
    return null;
  }

  return (
    <motion.div
      className="recently-viewed-sidebar"
      variants={fadeInRight}
      initial="hidden"
      animate="visible"
    >
      <div className="recently-viewed-header">
        <div className="header-content">
          <FaEye className="header-icon" />
          <h3>Recently Viewed</h3>
        </div>
        <motion.button
          className="close-btn"
          onClick={() => setIsVisible(false)}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaTimes />
        </motion.button>
      </div>

      <motion.div
        className="recently-viewed-list"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {recentProducts.map((product, index) => (
            <motion.div
              key={product._id}
              variants={staggerItem}
              layout
              exit={{ opacity: 0, x: 100 }}
            >
              <Link to={`/products/${product._id}`} className="recent-product-card">
                <motion.div
                  className="product-image-wrapper"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <img src={product.image} alt={product.name} />
                </motion.div>
                <div className="product-details">
                  <h4 className="product-name">{product.name}</h4>
                  <div className="product-price">
                    <span className="current-price">₹{product.price.toLocaleString()}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="discount-badge">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  {product.rating && (
                    <div className="product-rating">
                      <span className="stars">⭐ {product.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <motion.button
        className="clear-history-btn"
        onClick={() => {
          localStorage.removeItem('recentlyViewed');
          setRecentProducts([]);
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Clear History
      </motion.button>
    </motion.div>
  );
};

// Helper function to add product to recently viewed
export const addToRecentlyViewed = (product) => {
  try {
    const stored = localStorage.getItem('recentlyViewed');
    let recentProducts = stored ? JSON.parse(stored) : [];

    // Remove if already exists
    recentProducts = recentProducts.filter(p => p._id !== product._id);

    // Add to beginning
    recentProducts.unshift({
      _id: product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      rating: product.rating
    });

    // Keep only last 10
    recentProducts = recentProducts.slice(0, 10);

    localStorage.setItem('recentlyViewed', JSON.stringify(recentProducts));

    // Dispatch custom event
    window.dispatchEvent(new Event('recentlyViewedUpdate'));
  } catch (error) {
    console.error('Error saving to recently viewed:', error);
  }
};

export default RecentlyViewed;
