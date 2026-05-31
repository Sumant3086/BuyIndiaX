import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import { showToast } from '../utils/toast';
import './Newsletter.css';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      showToast('Successfully subscribed to newsletter! 🎉', 'success');
      setEmail('');
      setLoading(false);
    }, 1000);
  };

  return (
    <section className="newsletter-section">
      <div className="container">
        <motion.div
          className="newsletter-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="newsletter-content">
            <motion.div
              className="newsletter-icon"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FaEnvelope />
            </motion.div>
            <h2>Stay Updated with Our Latest Offers</h2>
            <p>Subscribe to our newsletter and get exclusive deals, new arrivals, and special promotions delivered to your inbox!</p>
          </div>
          
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="newsletter-input"
                disabled={loading}
              />
              <motion.button
                type="submit"
                className="newsletter-btn"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <FaPaperPlane /> Subscribe
                  </>
                )}
              </motion.button>
            </div>
            <p className="newsletter-privacy">
              🔒 We respect your privacy. Unsubscribe anytime.
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
