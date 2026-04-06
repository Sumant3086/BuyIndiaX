import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTruck, FaShieldAlt, FaHeadset, 
  FaArrowRight, FaCheck, FaTag, FaBolt
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import ScrollProgress from '../components/ScrollProgress';
import TrustBadges from '../components/TrustBadges';
import './Home.css';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const categories = [
    { name: 'Electronics', icon: '📱', link: '/products?category=Electronics', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Fashion', icon: '👗', link: '/products?category=Clothing', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Home & Kitchen', icon: '🏠', link: '/products?category=Home', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Books', icon: '📚', link: '/products?category=Books', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Sports', icon: '⚽', link: '/products?category=Sports', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'More', icon: '🎁', link: '/products?category=Other', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
  ];

  const features = [
    { 
      icon: <FaTruck />, 
      title: 'Free Delivery', 
      desc: 'On orders above ₹499',
      color: '#2563eb'
    },
    { 
      icon: <FaShieldAlt />, 
      title: '100% Secure', 
      desc: 'Safe & secure payments',
      color: '#10b981'
    },
    { 
      icon: <FaHeadset />, 
      title: '24/7 Support', 
      desc: 'Dedicated support team',
      color: '#8b5cf6'
    },
    { 
      icon: <FaCheck />, 
      title: 'Easy Returns', 
      desc: '30-day return policy',
      color: '#f59e0b'
    }
  ];

  const offers = [
    { title: 'Electronics Sale', discount: 'Up to 70% OFF', image: '🎧', color: '#667eea' },
    { title: 'Fashion Deals', discount: 'Min 50% OFF', image: '👕', color: '#f093fb' },
    { title: 'Home Essentials', discount: 'Starting ₹99', image: '🛋️', color: '#4facfe' }
  ];

  return (
    <>
      <LoadingScreen isLoading={loading} />
      <ScrollProgress />
      <div className="home">
        {/* Hero Section - Flipkart Style */}
        <section className="hero-flipkart">
          <div className="container">
            <div className="hero-grid">
              <motion.div
                className="hero-content"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div 
                  className="hero-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <FaBolt /> MEGA SALE
                </motion.div>
                <h1 className="hero-title">
                  Shop Smart,<br />
                  <span className="gradient-text">Save More</span>
                </h1>
                <p className="hero-subtitle">
                  Discover millions of products at unbeatable prices. Your one-stop shop for everything you need.
                </p>
                <div className="hero-actions">
                  <Link to="/products" className="btn btn-primary btn-large">
                    <FaTag /> Explore Deals
                  </Link>
                  {!user && (
                    <Link to="/register" className="btn btn-outline-white btn-large">
                      Sign Up Free
                    </Link>
                  )}
                </div>
                <div className="hero-stats">
                  <div className="stat">
                    <h3>10M+</h3>
                    <p>Products</p>
                  </div>
                  <div className="stat">
                    <h3>5M+</h3>
                    <p>Happy Customers</p>
                  </div>
                  <div className="stat">
                    <h3>1000+</h3>
                    <p>Brands</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="hero-visual"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="floating-cards">
                  {offers.map((offer, index) => (
                    <motion.div
                      key={index}
                      className="floating-card"
                      style={{ '--card-color': offer.color }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.05, rotate: 2 }}
                    >
                      <span className="card-icon">{offer.image}</span>
                      <h4>{offer.title}</h4>
                      <p className="discount">{offer.discount}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="section categories-section">
          <div className="container">
            <div className="section-header">
              <h2>Shop by Category</h2>
              <p>Browse through our wide range of categories</p>
            </div>
            <div className="categories-grid-flipkart">
              {categories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                >
                  <Link 
                    to={category.link} 
                    className="category-card-flipkart"
                    style={{ background: category.gradient }}
                  >
                    <span className="category-icon-large">{category.icon}</span>
                    <h3>{category.name}</h3>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section features-section">
          <div className="container">
            <div className="features-grid-flipkart">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="feature-card-flipkart"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                >
                  <div className="feature-icon-flipkart" style={{ background: feature.color }}>
                    {feature.icon}
                  </div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section cta-section">
          <div className="container">
            <motion.div
              className="cta-flipkart"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="cta-content">
                <h2>Ready to Start Shopping?</h2>
                <p>Join millions of happy customers and get the best deals</p>
                <Link to="/products" className="btn btn-primary btn-large">
                  Browse All Products <FaArrowRight />
                </Link>
              </div>
              <div className="cta-decoration">
                <motion.div 
                  className="cta-circle"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                  transition={{ duration: 10, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <TrustBadges />
      </div>
    </>
  );
};

export default Home;
