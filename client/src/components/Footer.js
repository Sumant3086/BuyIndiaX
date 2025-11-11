import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">🛍️ BuyIndiaX</h3>
            <p className="footer-text">Your trusted marketplace for quality products from India.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/products">Products</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Customer Service</h4>
            <ul className="footer-links">
              <li><a href="/shipping">Shipping Info</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/faq">FAQ</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Connect With Us</h4>
            <div className="social-links">
              <a href="#" className="social-icon">📘</a>
              <a href="#" className="social-icon">📷</a>
              <a href="#" className="social-icon">🐦</a>
              <a href="#" className="social-icon">💼</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 BuyIndiaX. All rights reserved. Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
