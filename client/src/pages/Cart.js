import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, loading } = useContext(CartContext);
  const navigate = useNavigate();

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      alert('Failed to update quantity');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      alert('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
  };

  if (loading) {
    return <div className="loading">Loading cart...</div>;
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <div className="container">
          <div className="empty-cart-content">
            <span className="empty-icon">🛒</span>
            <h2>Your cart is empty</h2>
            <p>Add some products to get started!</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products 🛍️
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Shopping Cart 🛒</h1>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item._id} className="cart-item">
                <img src={item.product.image} alt={item.product.name} className="cart-item-image" />
                
                <div className="cart-item-details">
                  <Link to={`/products/${item.product._id}`} className="cart-item-name">
                    {item.product.name}
                  </Link>
                  <p className="cart-item-category">{item.product.category}</p>
                  <p className="cart-item-price">₹{item.product.price.toLocaleString()}</p>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button 
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={() => handleRemove(item._id)}
                    className="btn-remove"
                  >
                    🗑️ Remove
                  </button>
                </div>

                <div className="cart-item-total">
                  ₹{(item.product.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
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
            <button 
              onClick={() => navigate('/checkout')}
              className="btn btn-primary btn-block"
            >
              Proceed to Checkout 🚀
            </button>
            <Link to="/products" className="continue-shopping">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
