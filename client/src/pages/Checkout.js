import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { FaShippingFast, FaCreditCard, FaLock } from 'react-icons/fa';
import { showToast } from '../utils/toast';
import { fadeInUp, slideIn } from '../theme/animations';
import './Checkout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STEPS = [
  { id: 1, name: 'Shipping', icon: FaShippingFast },
  { id: 2, name: 'Payment', icon: FaCreditCard }
];

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: ''
  });

  useEffect(() => {
    if (!cart.items || cart.items.length === 0) {
      showToast('Your cart is empty', 'warning');
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    return cart.items.reduce((sum, item) => {
      if (item.product && item.product.price) {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);
  };

  const validateShipping = () => {
    const { street, city, state, zipCode, country, phone } = shippingAddress;
    if (!street || !city || !state || !zipCode || !country || !phone) {
      showToast('Please fill all shipping address fields', 'error');
      return false;
    }
    if (phone.length < 10) {
      showToast('Please enter a valid phone number', 'error');
      return false;
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      setCurrentStep(2);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!validateShipping()) {
      setCurrentStep(1);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Create order from cart
      const orderResponse = await axios.post(
        `${API_URL}/orders`, 
        { shippingAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const order = orderResponse.data;

      // Create Razorpay order
      const paymentResponse = await axios.post(
        `${API_URL}/payment/create-order`,
        { 
          orderId: order._id,
          amount: calculateTotal()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId: razorpayOrderId, amount, currency, keyId } = paymentResponse.data;

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        showToast('Failed to load payment gateway. Please try again.', 'error');
        setLoading(false);
        return;
      }

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'BuyIndiaX',
        description: `Order #${order._id.slice(-8)}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            await axios.post(
              `${API_URL}/payment/verify`,
              {
                orderId: order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            await clearCart();
            showToast('Payment successful! 🎉', 'success');
            navigate(`/payment-confirm/${order._id}`);
          } catch (error) {
            console.error('Payment verification error:', error);
            showToast('Payment verification failed. Please contact support.', 'error');
            navigate('/orders');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: shippingAddress.phone
        },
        notes: {
          address: `${shippingAddress.street}, ${shippingAddress.city}`
        },
        theme: {
          color: '#2874f0'
        },
        modal: {
          ondismiss: function() {
            showToast('Payment cancelled', 'info');
            setLoading(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        showToast(`Payment failed: ${response.error.description}`, 'error');
        setLoading(false);
      });
      
      razorpayInstance.open();
      setLoading(false);

    } catch (error) {
      console.error('Order creation error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process order. Please try again.';
      showToast(errorMessage, 'error');
      setLoading(false);
    }
  };

  const validItems = cart.items?.filter(item => item.product) || [];

  if (validItems.length === 0) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <motion.h1 
          className="page-title"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          Checkout 🛍️
        </motion.h1>

        <motion.div 
          className="checkout-progress"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <motion.div 
                  className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    className="step-circle"
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                      transition: { duration: 1, repeat: isActive ? Infinity : 0 }
                    }}
                  >
                    <Icon />
                  </motion.div>
                  <span className="step-name">{step.name}</span>
                </motion.div>
                {index < STEPS.length - 1 && (
                  <div className="progress-line">
                    <motion.div 
                      className="progress-line-fill"
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </motion.div>

        <div className="checkout-layout">
          <div className="checkout-form-section">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  variants={slideIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="card"
                >
                  <h2><FaShippingFast /> Shipping Address</h2>
                  <form onSubmit={(e) => { e.preventDefault(); handleContinueToPayment(); }}>
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={user?.name || ''}
                        disabled
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={shippingAddress.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Street Address *</label>
                      <input
                        type="text"
                        name="street"
                        className="form-control"
                        value={shippingAddress.street}
                        onChange={handleChange}
                        placeholder="House No., Building Name, Street"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          name="city"
                          className="form-control"
                          value={shippingAddress.city}
                          onChange={handleChange}
                          placeholder="Mumbai"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>State *</label>
                        <input
                          type="text"
                          name="state"
                          className="form-control"
                          value={shippingAddress.state}
                          onChange={handleChange}
                          placeholder="Maharashtra"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>PIN Code *</label>
                        <input
                          type="text"
                          name="zipCode"
                          className="form-control"
                          value={shippingAddress.zipCode}
                          onChange={handleChange}
                          placeholder="400001"
                          maxLength="6"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Country *</label>
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

                    <div className="step-buttons">
                      <motion.button 
                        type="submit" 
                        className="btn btn-primary btn-block"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Continue to Payment →
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  variants={slideIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="card"
                >
                  <h2><FaCreditCard /> Payment</h2>
                  
                  <div className="shipping-summary">
                    <h3>Delivery Address</h3>
                    <div className="address-display">
                      <p><strong>{user?.name}</strong></p>
                      <p>{shippingAddress.phone}</p>
                      <p>{shippingAddress.street}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zipCode}</p>
                      <p>{shippingAddress.country}</p>
                    </div>
                    <motion.button
                      className="btn-link"
                      onClick={() => setCurrentStep(1)}
                      whileHover={{ scale: 1.05 }}
                    >
                      ✏️ Edit Address
                    </motion.button>
                  </div>

                  <div className="payment-info">
                    <div className="payment-method">
                      <FaCreditCard className="payment-icon" />
                      <div>
                        <h3>Razorpay Payment Gateway</h3>
                        <p>100% secure payment powered by Razorpay</p>
                        <div className="payment-options">
                          <span className="payment-badge">💳 Cards</span>
                          <span className="payment-badge">📱 UPI</span>
                          <span className="payment-badge">🏦 Net Banking</span>
                          <span className="payment-badge">💰 Wallets</span>
                        </div>
                      </div>
                    </div>

                    <div className="payment-summary">
                      <div className="summary-row">
                        <span>Subtotal ({validItems.length} items)</span>
                        <span>₹{calculateTotal().toLocaleString()}</span>
                      </div>
                      <div className="summary-row">
                        <span>Shipping</span>
                        <span className="free">FREE</span>
                      </div>
                      <div className="summary-divider"></div>
                      <div className="summary-row total">
                        <span>Total Amount</span>
                        <span>₹{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="security-note">
                      <FaLock /> Your payment information is encrypted and secure
                    </div>
                  </div>

                  <div className="step-buttons">
                    <motion.button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setCurrentStep(1)}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      ← Back
                    </motion.button>
                    <motion.button 
                      type="button" 
                      className="btn btn-primary btn-payment"
                      onClick={handlePayment}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ display: 'inline-block' }}
                          >
                            ⏳
                          </motion.span>
                          Processing...
                        </>
                      ) : (
                        <>💳 Proceed to Payment</>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            className="order-summary-section"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <div className="card sticky-summary">
              <h2>Order Summary</h2>
              <div className="order-items">
                {validItems.map((item) => (
                  <motion.div 
                    key={item._id} 
                    className="order-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <img 
                      src={item.product?.image || 'https://via.placeholder.com/60x60?text=No+Image'} 
                      alt={item.product?.name || 'Product'}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'; }}
                    />
                    <div className="order-item-info">
                      <p className="order-item-name">{item.product?.name || 'Product'}</p>
                      <p className="order-item-qty">Qty: {item.quantity}</p>
                    </div>
                    <p className="order-item-price">
                      ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                    </p>
                  </motion.div>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
