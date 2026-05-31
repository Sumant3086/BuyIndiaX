import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaTruck, FaShieldAlt, FaHeadset,
  FaArrowRight, FaCheck
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import ScrollProgress from '../components/ScrollProgress';
import TrustBadges from '../components/TrustBadges';
import TrendingProducts from '../components/TrendingProducts';
import Newsletter from '../components/Newsletter';
import './Home.css';

const Home = () => {
  const { user } = useContext(AuthContext);

  const categories = [
    { name: 'Fresh Produce', icon: '🥬', link: '/products?category=Fresh Produce', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Grocery', icon: '🛒', link: '/products?category=Grocery', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Beverages', icon: '🥤', link: '/products?category=Beverages', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Health & Beauty', icon: '💄', link: '/products?category=Health & Beauty', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Non-Food Items', icon: '🧹', link: '/products?category=Non-Food Items', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'All Products', icon: '🎁', link: '/products', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
  ];

  const features = [
    { 
      icon: <FaTruck />, 
      title: 'Express Delivery', 
      desc: 'Same-day & next-day options',
      color: '#2563eb'
    },
    { 
      icon: <FaShieldAlt />, 
      title: 'Enterprise Security', 
      desc: 'PCI-DSS compliant payments',
      color: '#10b981'
    },
    { 
      icon: <FaHeadset />, 
      title: 'Priority Support', 
      desc: 'Dedicated account managers',
      color: '#8b5cf6'
    },
    { 
      icon: <FaCheck />, 
      title: 'Quality Guarantee', 
      desc: 'Certified & verified products',
      color: '#f59e0b'
    }
  ];

  const offers = [
    { title: 'Fresh Daily', discount: 'Farm to Table', image: '🥬', color: '#43e97b' },
    { title: 'Quality Assured', discount: 'Certified Products', image: '✓', color: '#fa709a' },
    { title: 'Fast Delivery', discount: 'Same Day Available', image: '🚚', color: '#f093fb' }
  ];

  return (
    <>
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
                  Your Trusted<br />
                  <span className="gradient-text">Retail Partner</span>
                </h1>
                <p className="hero-subtitle">
                  Enterprise-grade retail platform serving billions of customers worldwide. Quality products, seamless experience, unmatched reliability.
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
                    <h3>250+</h3>
                    <p>Premium Products</p>
                  </div>
                  <div className="stat">
                    <h3>50K+</h3>
                    <p>Daily Orders</p>
                  </div>
                  <div className="stat">
                    <h3>99.9%</h3>
                    <p>Uptime SLA</p>
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

        {/* Trending Products Section */}
        <TrendingProducts />

        {/* Newsletter Section */}
        <Newsletter />

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
                <h2>Experience Retail Excellence</h2>
                <p>Join thousands of businesses and customers who trust our platform for their daily needs</p>
                <Link to="/products" className="btn btn-primary btn-large">
                  Explore Our Catalog <FaArrowRight />
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
