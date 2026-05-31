import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFire, FaStar, FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import api from '../utils/api';
import { handleImageError, getFallbackImage } from '../utils/imageHelper';
import './TrendingProducts.css';

const TrendingProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=8');
      setProducts((data.products || []).slice(0, 8));
    } catch (error) {
      console.error('Error fetching trending products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="trending-section">
        <div className="container">
          <div className="section-header">
            <h2>Loading...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="trending-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="header-content">
            <motion.div
              className="fire-icon"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FaFire />
            </motion.div>
            <div>
              <h2>Trending Products</h2>
              <p>Hot deals everyone is buying right now</p>
            </div>
          </div>
          <Link to="/products" className="view-all-btn">
            View All <FaArrowRight />
          </Link>
        </motion.div>

        <div className="trending-grid">
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              className="trending-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Link to={`/products/${product._id}`} className="trending-image">
                <img
                  src={product.image || getFallbackImage(product.category)}
                  alt={product.name}
                  onError={(e) => handleImageError(e, product.category)}
                />
                <div className="trending-badge">
                  <FaFire /> #{index + 1}
                </div>
              </Link>

              <div className="trending-info">
                <Link to={`/products/${product._id}`} className="trending-name">
                  {product.name}
                </Link>
                <p className="trending-category">{product.category}</p>
                
                <div className="trending-rating">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < Math.round(product.rating || 4) ? 'star-filled' : 'star-empty'}
                    />
                  ))}
                  <span>({product.numReviews || Math.floor(Math.random() * 100) + 20})</span>
                </div>

                <div className="trending-footer">
                  <div className="price-section">
                    <span className="trending-price">₹{product.price.toLocaleString()}</span>
                    {product.stock < 10 && product.stock > 0 && (
                      <span className="stock-badge">Only {product.stock} left</span>
                    )}
                  </div>
                  <motion.button
                    className="quick-add-btn"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaShoppingCart />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
