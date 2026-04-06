import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { showToast } from '../utils/toast';
import './Cart.css';

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, loading } = useContext(CartContext);
  const navigate = useNavigate();

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, newQuantity);
      showToast('Cart updated!', 'success');
    } catch (error) {
      showToast('Failed to update quantity', 'error');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      showToast('Item removed from cart', 'success');
    } catch (error) {
      showToast('Failed to remove item', 'error');
    }
  };

  const calculateTotal = () => {
    return cart.items.reduce((sum, item) => {
      if (item.product && item.product.price) {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);
  };

  if (loading) {
    return (
      <motion.div 
        className="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Loading cart...
      </motion.div>
    );
  }

  // Filter out items with null products
  const validItems = cart.items?.filter(item => item.product) || [];

  if (validItems.length === 0) {
    return (
      <div className="empty-cart">
        <div className="container">
          <motion.div 
            className="empty-cart-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span 
              className="empty-icon"
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🛒
            </motion.span>
            <h2>Your cart is empty</h2>
            <p>Add some products to get started!</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products" className="btn btn-primary">
                Browse Products 🛍️
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="cart-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <motion.h1 
          className="page-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Shopping Cart 🛒
        </motion.h1>

        <div className="cart-layout">
          <div className="cart-items">
            <AnimatePresence>
              {validItems.map((item, index) => (
                <motion.div 
                  key={item._id} 
                  className="cart-item"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50, height: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.img 
                    src={item.product?.image || 'https://via.placeholder.com/150x150?text=No+Image'} 
                    alt={item.product?.name || 'Product'} 
                    className="cart-item-image"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150x150?text=No+Image'; }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                
                  <div className="cart-item-details">
                    <Link to={`/products/${item.product._id}`} className="cart-item-name">
                      {item.product.name || 'Product'}
                    </Link>
                    <p className="cart-item-category">{item.product.category || 'Other'}</p>
                    <p className="cart-item-price">₹{(item.product.price || 0).toLocaleString()}</p>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <motion.button 
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        className="qty-btn"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        -
                      </motion.button>
                      <span className="quantity">{item.quantity}</span>
                      <motion.button 
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        className="qty-btn"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        +
                      </motion.button>
                    </div>

                    <motion.button 
                      onClick={() => handleRemove(item._id)}
                      className="btn-remove"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🗑️ Remove
                    </motion.button>
                  </div>

                  <div className="cart-item-total">
                    ₹{((item.product.price || 0) * item.quantity).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.div 
            className="cart-summary"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{calculateTotal().toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free">FREE</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{calculateTotal().toLocaleString()}</span>
            </div>
            <motion.button 
              onClick={() => navigate('/checkout')}
              className="btn btn-primary btn-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Proceed to Checkout 🚀
            </motion.button>
            <Link to="/products" className="continue-shopping">
              ← Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Cart;
