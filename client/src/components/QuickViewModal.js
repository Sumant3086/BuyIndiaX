import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaShoppingCart, FaHeart, FaMinus, FaPlus, FaRegHeart } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from '../utils/toast';
import './QuickViewModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!product) return null;

  const images = product.images?.length > 0 
    ? product.images.map(img => img.url) 
    : [product.image];

  const handleAddToCart = async () => {
    if (!user) {
      toast.warning('Please login to add items to cart');
      navigate('/login');
      onClose();
      return;
    }

    try {
      await addToCart(product._id, quantity);
      toast.success(`Added ${quantity} item(s) to cart! 🛒`);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.warning('Please login to add to wishlist');
      navigate('/login');
      onClose();
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

  const handleViewDetails = () => {
    navigate(`/products/${product._id}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="quick-view-modal"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <motion.button
              className="modal-close-btn"
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes />
            </motion.button>

            <div className="modal-content">
              {/* Left: Images */}
              <div className="modal-images">
                <motion.div
                  className="main-image"
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={images[selectedImage]} alt={product.name} />
                </motion.div>

                {images.length > 1 && (
                  <div className="image-thumbnails">
                    {images.map((img, index) => (
                      <motion.div
                        key={index}
                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => setSelectedImage(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img src={img} alt={`${product.name} ${index + 1}`} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details */}
              <div className="modal-details">
                {/* Brand */}
                {product.brand && (
                  <motion.span
                    className="product-brand"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {product.brand}
                  </motion.span>
                )}

                {/* Name */}
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {product.name}
                </motion.h2>

                {/* Rating */}
                <motion.div
                  className="product-rating"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={i < Math.round(product.rating) ? 'star-filled' : 'star-empty'}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="rating-text">
                    {product.rating} ({product.numReviews} reviews)
                  </span>
                </motion.div>

                {/* Price */}
                <motion.div
                  className="price-section"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <span className="current-price">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                      <span className="discount-badge">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </motion.div>

                {/* Description */}
                <motion.p
                  className="product-description"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {product.description}
                </motion.p>

                {/* Stock Status */}
                <motion.div
                  className="stock-status"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  {product.stock > 0 ? (
                    <span className="in-stock">
                      ✓ In Stock ({product.stock} available)
                    </span>
                  ) : (
                    <span className="out-of-stock">✗ Out of Stock</span>
                  )}
                </motion.div>

                {/* Quantity Selector */}
                {product.stock > 0 && (
                  <motion.div
                    className="quantity-section"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label>Quantity:</label>
                    <div className="quantity-controls">
                      <motion.button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={quantity <= 1}
                      >
                        <FaMinus />
                      </motion.button>
                      <span className="quantity-value">{quantity}</span>
                      <motion.button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={quantity >= product.stock}
                      >
                        <FaPlus />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  className="action-buttons"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <motion.button
                    className="btn-add-cart"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaShoppingCart />
                    <span>Add to Cart</span>
                  </motion.button>

                  <motion.button
                    className={`btn-wishlist ${isWishlisted ? 'active' : ''}`}
                    onClick={handleWishlist}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isWishlisted ? <FaHeart /> : <FaRegHeart />}
                  </motion.button>
                </motion.div>

                {/* View Full Details */}
                <motion.button
                  className="btn-view-details"
                  onClick={handleViewDetails}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Full Details →
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
