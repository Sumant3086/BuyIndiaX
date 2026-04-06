import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaShoppingCart, 
  FaCreditCard, 
  FaBox, 
  FaShippingFast, 
  FaCheckCircle, 
  FaTimesCircle 
} from 'react-icons/fa';
import { staggerContainer, staggerItem } from '../theme/animations';
import './OrderTimeline.css';

const STATUS_CONFIG = {
  'Pending': {
    icon: FaShoppingCart,
    color: '#f39c12',
    label: 'Order Placed',
    description: 'Your order has been received'
  },
  'Processing': {
    icon: FaCreditCard,
    color: '#3498db',
    label: 'Payment Confirmed',
    description: 'Payment verified and order is being processed'
  },
  'Packed': {
    icon: FaBox,
    color: '#9b59b6',
    label: 'Order Packed',
    description: 'Your order has been packed and ready to ship'
  },
  'Shipped': {
    icon: FaShippingFast,
    color: '#e67e22',
    label: 'Order Shipped',
    description: 'Your order is on the way'
  },
  'Delivered': {
    icon: FaCheckCircle,
    color: '#27ae60',
    label: 'Delivered',
    description: 'Order delivered successfully'
  },
  'Cancelled': {
    icon: FaTimesCircle,
    color: '#e74c3c',
    label: 'Cancelled',
    description: 'Order has been cancelled'
  }
};

const TIMELINE_STEPS = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];

const OrderTimeline = ({ order }) => {
  const currentStatus = order.status;
  const isCancelled = currentStatus === 'Cancelled';
  
  // Find current step index
  const currentStepIndex = TIMELINE_STEPS.indexOf(currentStatus);
  
  // Get timeline steps to display
  const timelineSteps = isCancelled 
    ? [TIMELINE_STEPS[0], 'Cancelled'] 
    : TIMELINE_STEPS;

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStepStatus = (stepIndex) => {
    if (isCancelled) {
      if (stepIndex === 0) return 'completed';
      if (stepIndex === 1) return 'completed';
      return 'pending';
    }
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="order-timeline-container">
      <motion.div
        className="timeline-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3>Order Status</h3>
        <div className="order-id">Order #{order._id.slice(-8).toUpperCase()}</div>
      </motion.div>

      <motion.div
        className="order-timeline"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {timelineSteps.map((step, index) => {
          const config = STATUS_CONFIG[step];
          const Icon = config.icon;
          const status = getStepStatus(index);
          const isLast = index === timelineSteps.length - 1;

          return (
            <motion.div
              key={step}
              className={`timeline-step ${status}`}
              variants={staggerItem}
            >
              <div className="timeline-content">
                {/* Icon Circle */}
                <motion.div
                  className="timeline-icon-wrapper"
                  style={{ 
                    borderColor: status !== 'pending' ? config.color : 'var(--border-color)',
                    background: status !== 'pending' ? config.color : 'var(--bg-secondary)'
                  }}
                  animate={{
                    scale: status === 'active' ? [1, 1.1, 1] : 1,
                    boxShadow: status === 'active' 
                      ? [
                          `0 0 0 0 ${config.color}40`,
                          `0 0 0 10px ${config.color}00`,
                          `0 0 0 0 ${config.color}40`
                        ]
                      : 'none'
                  }}
                  transition={{
                    duration: 2,
                    repeat: status === 'active' ? Infinity : 0
                  }}
                >
                  <Icon 
                    className="timeline-icon" 
                    style={{ color: status !== 'pending' ? 'white' : 'var(--text-secondary)' }}
                  />
                </motion.div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className="timeline-line">
                    <motion.div
                      className="timeline-line-fill"
                      style={{ background: config.color }}
                      initial={{ height: '0%' }}
                      animate={{ 
                        height: status === 'completed' ? '100%' : '0%' 
                      }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                    />
                  </div>
                )}
              </div>

              {/* Step Details */}
              <motion.div
                className="timeline-details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <h4 className="timeline-label">{config.label}</h4>
                <p className="timeline-description">{config.description}</p>
                {status === 'completed' && (
                  <motion.p 
                    className="timeline-date"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {formatDate(order.createdAt)}
                  </motion.p>
                )}
                {status === 'active' && (
                  <motion.div
                    className="timeline-badge"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    Current Status
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Estimated Delivery */}
      {!isCancelled && currentStatus !== 'Delivered' && (
        <motion.div
          className="estimated-delivery"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="delivery-icon">📦</div>
          <div className="delivery-info">
            <h4>Estimated Delivery</h4>
            <p className="delivery-date">
              {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </motion.div>
      )}

      {/* Delivery Address */}
      <motion.div
        className="delivery-address"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4>Delivery Address</h4>
        <div className="address-content">
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderTimeline;
