import React from 'react';
import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <footer className="footer">
      <div className="container">
        <motion.div 
          className="footer-content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="footer-section" variants={itemVariants}>
            <motion.h3 
              className="footer-title"
              whileHover={{ scale: 1.05 }}
            >
              🛍️ BuyIndiaX
            </motion.h3>
            <p className="footer-text">Your trusted marketplace for quality products from India.</p>
          </motion.div>
          
          <motion.div className="footer-section" variants={itemVariants}>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <motion.li whileHover={{ x: 5 }}><a href="/products">Products</a></motion.li>
              <motion.li whileHover={{ x: 5 }}><a href="/about">About Us</a></motion.li>
              <motion.li whileHover={{ x: 5 }}><a href="/contact">Contact</a></motion.li>
            </ul>
          </motion.div>
          
          <motion.div className="footer-section" variants={itemVariants}>
            <h4>Customer Service</h4>
            <ul className="footer-links">
              <motion.li whileHover={{ x: 5 }}><a href="/shipping">Shipping Info</a></motion.li>
              <motion.li whileHover={{ x: 5 }}><a href="/returns">Returns</a></motion.li>
              <motion.li whileHover={{ x: 5 }}><a href="/faq">FAQ</a></motion.li>
            </ul>
          </motion.div>
          
          <motion.div className="footer-section" variants={itemVariants}>
            <h4>Connect With Us</h4>
            <div className="social-links">
              <motion.a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon"
                whileHover={{ scale: 1.3, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
              >
                📘
              </motion.a>
              <motion.a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon"
                whileHover={{ scale: 1.3, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
              >
                📷
              </motion.a>
              <motion.a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon"
                whileHover={{ scale: 1.3, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
              >
                🐦
              </motion.a>
              <motion.a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon"
                whileHover={{ scale: 1.3, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
              >
                💼
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="footer-bottom"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p>&copy; 2024 BuyIndiaX. All rights reserved. Made with ❤️ in India</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
