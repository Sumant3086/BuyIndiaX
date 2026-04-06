import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaShoppingCart, FaEye, FaExchangeAlt, FaRegHeart } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import toast from '../utils/toast';
import './ProductCard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProductCard = ({ product, onQuickView, onCompare }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.warning('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await addToCart(product._id, 1);
      toast.success('Added to cart! 🛒');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.warning('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isWishlisted) {
        await axios.delete(`${API_URL}/wishlist/${product._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWishlisted(false);
        toast.info('Removed from wishlist');
      } else {
        await axios.post(
          `${API_URL}/wishlist/add`,
          { productId: product._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsWishlisted(true);
        toast.success('Added to wishlist! ❤️');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompare) onCompare(product);
  };

  const discountPercentage = product.discount || 
    (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);

  const isLowStock = product.stock > 0 && product.stock < 10;
  const isOutOfStock = product.stock === 0;

  return (
    <motion.div
      className="product-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/products/${product._id}`} className="product-card-link">
        {/* Image Container */}
        <div className="product-image-container">
          {/* Badges */}
          <div className="product-badges">
            {discountPercentage > 0 && (
              <motion.span
                className="badge badge-discount"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {discountPercentage}% OFF
              </motion.span>
            )}
            {product.isFeatured && (
              <motion.span
                className="badge badge-featured"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                ⭐ Featured
              </motion.span>
            )}
            {product.isFlashSale && (
              <motion.span
                className="badge badge-flash"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⚡ Flash Sale
              </motion.span>
            )}
          </div>

          {/* Image */}
          <div className="product-image-wrapper">
            {!imageLoaded && (
              <div className="image-skeleton shimmer-effect" />
            )}
            <motion.img
              src={product.image}
              alt={product.name}
              className="product-image"
              style={{ display: imageLoaded ? 'block' : 'none' }}
              onLoad={() => setImageLoaded(true)}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Quick Actions */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="quick-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  className="quick-action-btn"
                  onClick={handleQuickView}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Quick View"
                >
                  <FaEye />
                </motion.button>
                <motion.button
                  className="quick-action-btn"
                  onClick={handleCompare}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Compare"
                >
                  <FaExchangeAlt />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wishlist Button */}
          <motion.button
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlist}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isWishlisted ? (
                <motion.div
                  key="filled"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <FaHeart />
                </motion.div>
              ) : (
                <motion.div
                  key="outline"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <FaRegHeart />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Stock Status */}
          {isOutOfStock && (
            <div className="stock-overlay">
              <span>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          {/* Brand */}
          {product.brand && (
            <span className="product-brand">{product.brand}</span>
          )}

          {/* Name */}
          <h3 className="product-name">{product.name}</h3>

          {/* Rating */}
          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={i < Math.round(product.rating) ? 'star-filled' : 'star-empty'}
                >
                  ⭐
                </motion.span>
              ))}
            </div>
            <span className="rating-count">({product.numReviews})</span>
          </div>

          {/* Price */}
          <div className="product-price-section">
            <div className="price-container">
              <span className="current-price">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Stock Warning */}
          {isLowStock && (
            <motion.div
              className="stock-warning"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⚠️
              </motion.span>
              Only {product.stock} left!
            </motion.div>
          )}

          {/* Add to Cart Button */}
          <motion.button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaShoppingCart />
            <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
          </motion.button>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
