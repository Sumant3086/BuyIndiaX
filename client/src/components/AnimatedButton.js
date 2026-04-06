import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './AnimatedButton.css';

const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  icon,
  loading = false,
  disabled = false,
  ...props 
}) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled || loading) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples([...ripples, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
    }, 600);

    if (onClick) onClick(e);
  };

  return (
    <motion.button
      className={`animated-btn animated-btn-${variant} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      {...props}
    >
      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
        />
      ))}

      {/* Loading Spinner */}
      {loading && (
        <motion.span
          className="btn-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          ⏳
        </motion.span>
      )}

      {/* Icon */}
      {icon && !loading && (
        <motion.span
          className="btn-icon"
          initial={{ x: 0 }}
          whileHover={{ x: 5 }}
        >
          {icon}
        </motion.span>
      )}

      {/* Content */}
      <span className="btn-content">{children}</span>

      {/* Shine Effect */}
      <span className="btn-shine" />
    </motion.button>
  );
};

export default AnimatedButton;
