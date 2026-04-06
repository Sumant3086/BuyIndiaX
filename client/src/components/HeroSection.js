import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaShoppingBag, FaTruck, FaShieldAlt } from 'react-icons/fa';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Parallax effects
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="hero-section">
      {/* Animated Background */}
      <div className="hero-background">
        <motion.div 
          className="gradient-orb orb-1"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="gradient-orb orb-2"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="gradient-orb orb-3"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <div className="hero-content">
        <motion.div
          className="hero-text"
          style={{ opacity, y: y1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="hero-badge">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                ✨
              </motion.span>
              New Arrivals
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
            }}
          >
            Shop The
            <br />
            <span className="gradient-text">Vibes</span> 🔥
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Get the freshest drops with insane deals and lightning-fast shipping.
            No cap, just vibes! 💯✨
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.button
              className="btn-hero btn-primary"
              onClick={() => navigate('/products')}
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255, 0, 110, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Let's Go! 🚀</span>
              <FaArrowRight />
            </motion.button>

            <motion.button
              className="btn-hero btn-secondary"
              onClick={() => navigate('/products')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Deals 🔥
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="hero-features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="feature-item">
              <FaShoppingBag />
              <span>10K+ Products 🛍️</span>
            </div>
            <div className="feature-item">
              <FaTruck />
              <span>Free Shipping 📦</span>
            </div>
            <div className="feature-item">
              <FaShieldAlt />
              <span>Secure AF 🔒</span>
            </div>
          </motion.div>
        </motion.div>

        {/* 3D Product Showcase */}
        <motion.div
          className="hero-visual"
          style={{ y: y2 }}
        >
          <motion.div
            className="product-card-3d"
            animate={{
              rotateY: [0, 10, 0, -10, 0],
              rotateX: [0, 5, 0, -5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`
            }}
          >
            <div className="card-shine" />
            <div className="product-image-wrapper">
              <motion.img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
                alt="Featured Product"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <div className="product-glow" />
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            className="floating-stat stat-1"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">4.9</div>
              <div className="stat-label">Rating</div>
            </div>
          </motion.div>

          <motion.div
            className="floating-stat stat-2"
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">50%</div>
              <div className="stat-label">Off</div>
            </div>
          </motion.div>

          <motion.div
            className="floating-stat stat-3"
            animate={{
              y: [0, -15, 0],
              rotate: [0, 3, 0]
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            <div className="stat-icon">🚀</div>
            <div className="stat-content">
              <div className="stat-value">24h</div>
              <div className="stat-label">Delivery</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="scroll-indicator"
        animate={{
          y: [0, 10, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="scroll-line" />
        <span>Scroll to explore</span>
      </motion.div>
    </div>
  );
};

export default HeroSection;
