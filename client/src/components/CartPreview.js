import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaTimes, FaTrash } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import toast from '../utils/toast';
import './CartPreview.css';

const CartPreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, removeFromCart, updateCartItem } = useContext(CartContext);

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const calculateTotal = () => {
    return cart?.items?.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0) || 0;
  };

  const itemCount = cart?.items?.length || 0;

  return (
    <div
      className="cart-preview-container"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Cart Icon */}
      <Link to="/cart" className="cart-icon-link">
        <motion.div
          className="cart-icon"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaShoppingCart />
          {itemCount > 0 && (
            <motion.span
              className="cart-count"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={itemCount}
            >
              {itemCount}
            </motion.span>
          )}
        </motion.div>
      </Link>

      {/* Preview Dropdown */}
      <AnimatePresence>
        {isOpen && itemCount > 0 && (
          <motion.div
            className="cart-preview-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="preview-header">
              <h3>Shopping Cart ({itemCount})</h3>
            </div>

            {/* Items */}
            <div className="preview-items">
              {cart.items.map((item, index) => (
                <motion.div
                  key={item._id}
                  className="preview-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <img
                    src={item.product?.image}
                    alt={item.product?.name}
                    className="item-image"
                  />
                  <div className="item-details">
                    <h4>{item.product?.name}</h4>
                    <div className="item-price-qty">
                      <span className="item-price">
                        ₹{item.product?.price?.toLocaleString()}
                      </span>
                      <div className="qty-controls">
                        <button
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    className="remove-btn"
                    onClick={() => handleRemove(item._id)}
                    whileHover={{ scale: 1.1, color: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTrash />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="preview-footer">
              <div className="total-section">
                <span>Subtotal:</span>
                <span className="total-amount">₹{calculateTotal().toLocaleString()}</span>
              </div>
              <Link to="/cart" className="view-cart-btn">
                View Cart
              </Link>
              <Link to="/checkout" className="checkout-btn">
                Checkout
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPreview;
