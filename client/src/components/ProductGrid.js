import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { staggerContainer, staggerItem } from '../theme/animations';
import './ProductGrid.css';

const ProductGrid = ({ products, loading, onQuickView, onCompare }) => {
  const [view, setView] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('featured');

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="product-grid-loading">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="product-skeleton">
            <div className="skeleton-image shimmer-effect" />
            <div className="skeleton-content">
              <div className="skeleton-line shimmer-effect" style={{ width: '80%' }} />
              <div className="skeleton-line shimmer-effect" style={{ width: '60%' }} />
              <div className="skeleton-line shimmer-effect" style={{ width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="product-grid-container">
      {/* Grid Controls */}
      <motion.div 
        className="grid-controls"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="results-count">
          <span className="count-number">{products.length}</span>
          <span className="count-text">Products Found</span>
        </div>

        <div className="grid-actions">
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          <div className="view-toggle">
            <motion.button
              className={`view-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect x="2" y="2" width="7" height="7" rx="1" />
                <rect x="11" y="2" width="7" height="7" rx="1" />
                <rect x="2" y="11" width="7" height="7" rx="1" />
                <rect x="11" y="11" width="7" height="7" rx="1" />
              </svg>
            </motion.button>
            <motion.button
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect x="2" y="3" width="16" height="3" rx="1" />
                <rect x="2" y="8" width="16" height="3" rx="1" />
                <rect x="2" y="13" width="16" height="3" rx="1" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Product Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          className={`product-grid ${view === 'list' ? 'list-view' : ''}`}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {sortedProducts.map((product, index) => (
            <motion.div
              key={product._id}
              variants={staggerItem}
              custom={index}
              layout
            >
              <ProductCard
                product={product}
                onQuickView={onQuickView}
                onCompare={onCompare}
                viewMode={view}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="empty-icon">🔍</div>
          <h3>No Products Found</h3>
          <p>Try adjusting your filters or search terms</p>
        </motion.div>
      )}
    </div>
  );
};

export default ProductGrid;
