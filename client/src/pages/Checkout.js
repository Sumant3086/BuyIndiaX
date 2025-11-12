import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import './Checkout.css';

const API_URL = 'http://localhost:5000/api';

const Checkout = () => {
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  const handleChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    return cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create order first
      const orderResponse = await axios.post(`${API_URL}/orders`, { shippingAddress });
      const order = orderResponse.data;

      // Get payment link
      const paymentLinkResponse = await axios.post(`${API_URL}/payment/payment-link`, {
        orderId: order._id
      });

      const { paymentLink, amount } = paymentLinkResponse.data;

      // Show payment instructions
      const proceed = window.confirm(
        `Order created successfully!\n\n` +
        `Total Amount: ₹${amount.toLocaleString()}\n\n` +
        `Click OK to open Razorpay payment page.\n` +
        `After completing payment, you'll be redirected back to confirm.`
      );

      if (proceed) {
        // Store order ID for confirmation
        localStorage.setItem('pendingOrderId', order._id);
        
        // Open payment link in new tab
        window.open(paymentLink, '_blank');
        
        // Redirect to confirmation page
        navigate(`/payment-confirm/${order._id}`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Checkout 🛍️</h1>

        <div className="checkout-layout">
          <div className="checkout-form-section">
            <div className="card">
              <h2>Shipping Address</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="street"
                    className="form-control"
                    value={shippingAddress.street}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      value={shippingAddress.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      className="form-control"
                      value={shippingAddress.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      className="form-control"
                      value={shippingAddress.zipCode}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      className="form-control"
                      value={shippingAddress.country}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Processing...' : 'Proceed to Payment 💳'}
                </button>
              </form>
            </div>
          </div>

          <div className="order-summary-section">
            <div className="card">
              <h2>Order Summary</h2>
              <div className="order-items">
                {cart.items.map((item) => (
                  <div key={item._id} className="order-item">
                    <img src={item.product.image} alt={item.product.name} />
                    <div className="order-item-info">
                      <p className="order-item-name">{item.product.name}</p>
                      <p className="order-item-qty">Qty: {item.quantity}</p>
                    </div>
                    <p className="order-item-price">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="order-total">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Shipping</span>
                  <span className="free">FREE</span>
                </div>
                <div className="total-divider"></div>
                <div className="total-row final">
                  <span>Total</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
