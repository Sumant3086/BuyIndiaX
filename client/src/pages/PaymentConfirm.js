import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import './PaymentConfirm.css';

const API_URL = 'http://localhost:5000/api';

const PaymentConfirm = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { fetchCart } = useContext(CartContext);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!transactionId.trim()) {
      alert('Please enter transaction ID');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/payment/confirm-payment`, {
        orderId,
        transactionId
      });

      await fetchCart();
      localStorage.removeItem('pendingOrderId');
      
      alert('Payment confirmed successfully! 🎉');
      navigate('/orders');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const confirm = window.confirm('Are you sure you want to cancel? Your order will remain unpaid.');
    if (confirm) {
      localStorage.removeItem('pendingOrderId');
      navigate('/orders');
    }
  };

  return (
    <div className="payment-confirm-page">
      <div className="container">
        <div className="confirm-card">
          <div className="confirm-header">
            <span className="confirm-icon">💳</span>
            <h1>Confirm Your Payment</h1>
            <p>Please complete the payment and enter your transaction details below</p>
          </div>

          <div className="payment-instructions">
            <h3>Payment Instructions:</h3>
            <ol>
              <li>Complete the payment on the Razorpay page that opened</li>
              <li>Note down your Transaction ID / Payment ID</li>
              <li>Enter the Transaction ID below and click Confirm</li>
            </ol>
          </div>

          <div className="confirm-form">
            <div className="form-group">
              <label>Transaction ID / Payment ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <small>You can find this in your payment confirmation email or SMS</small>
            </div>

            <div className="button-group">
              <button 
                onClick={handleConfirm} 
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? 'Confirming...' : 'Confirm Payment ✓'}
              </button>
              <button 
                onClick={handleCancel} 
                className="btn btn-outline btn-lg"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="help-section">
            <p>💡 <strong>Tip:</strong> If you haven't completed the payment yet, the payment page should still be open in another tab.</p>
            <p>📧 Need help? Contact support with your Order ID: <strong>{orderId.slice(-8)}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirm;
