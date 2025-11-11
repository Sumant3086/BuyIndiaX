import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const categories = [
    { name: 'Electronics', icon: '💻', color: '#3498db' },
    { name: 'Clothing', icon: '👕', color: '#e74c3c' },
    { name: 'Books', icon: '📚', color: '#2ecc71' },
    { name: 'Home', icon: '🏠', color: '#f39c12' },
    { name: 'Sports', icon: '⚽', color: '#9b59b6' },
    { name: 'Other', icon: '🎁', color: '#1abc9c' }
  ];

  const features = [
    { icon: '🚚', title: 'Free Shipping', desc: 'On orders over ₹500' },
    { icon: '🔒', title: 'Secure Payment', desc: '100% secure transactions' },
    { icon: '↩️', title: 'Easy Returns', desc: '30-day return policy' },
    { icon: '💬', title: '24/7 Support', desc: 'Dedicated customer service' }
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="highlight">BuyIndiaX</span>
            </h1>
            <p className="hero-subtitle">
              Discover amazing products from across India. Quality guaranteed, prices unbeatable!
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary btn-lg">
                Shop Now 🛍️
              </Link>
              <Link to="/products" className="btn btn-outline btn-lg">
                Explore Products
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card">
              <span className="emoji">🎉</span>
              <p>Special Offers</p>
            </div>
            <div className="floating-card delay-1">
              <span className="emoji">⚡</span>
              <p>Fast Delivery</p>
            </div>
            <div className="floating-card delay-2">
              <span className="emoji">✨</span>
              <p>Premium Quality</p>
            </div>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <Link 
                key={index} 
                to={`/products?category=${category.name}`} 
                className="category-card"
                style={{ '--category-color': category.color }}
              >
                <span className="category-icon">{category.icon}</span>
                <h3>{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose BuyIndiaX?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Shopping?</h2>
            <p>Join thousands of happy customers shopping on BuyIndiaX</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Account 🚀
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
