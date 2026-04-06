import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaTimes, FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import toast from '../utils/toast';
import './Comparison.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Comparison = () => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    if (user) {
      fetchComparison();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchComparison = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/comparison`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComparison(response.data);
    } catch (error) {
      console.error('Error fetching comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/comparison/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchComparison();
      toast.success('Product removed from comparison');
    } catch (error) {
      toast.error('Failed to remove product');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      toast.success('Added to cart! 🛒');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/comparison`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchComparison();
      toast.success('Comparison cleared');
    } catch (error) {
      toast.error('Failed to clear comparison');
    }
  };

  if (loading) {
    return <div className="loading">Loading comparison...</div>;
  }

  if (!user) {
    return (
      <div className="comparison-page">
        <div className="container">
          <div className="empty-state">
            <h2>Please login to compare products</h2>
            <Link to="/login" className="btn btn-primary">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  const products = comparison?.products || [];

  if (products.length === 0) {
    return (
      <div className="comparison-page">
        <div className="container">
          <div className="empty-state">
            <h2>No products to compare</h2>
            <p>Add products to comparison from the product listing page</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  const features = [
    { key: 'price', label: 'Price', format: (val) => `₹${val?.toLocaleString()}` },
    { key: 'rating', label: 'Rating', format: (val) => `${val}/5 ⭐` },
    { key: 'numReviews', label: 'Reviews', format: (val) => `${val} reviews` },
    { key: 'brand', label: 'Brand', format: (val) => val || 'N/A' },
    { key: 'category', label: 'Category', format: (val) => val },
    { key: 'stock', label: 'Availability', format: (val) => val > 0 ? `In Stock (${val})` : 'Out of Stock' },
    { key: 'discount', label: 'Discount', format: (val) => val ? `${val}% OFF` : 'No discount' }
  ];

  return (
    <div className="comparison-page">
      <div className="container">
        <motion.div
          className="comparison-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Product Comparison</h1>
          <button className="btn-clear-all" onClick={handleClearAll}>
            Clear All
          </button>
        </motion.div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="feature-column">Features</th>
                {products.map((product, index) => (
                  <th key={product._id}>
                    <motion.div
                      className="product-header"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(product._id)}
                      >
                        <FaTimes />
                      </button>
                      <Link to={`/products/${product._id}`}>
                        <img src={product.image} alt={product.name} />
                      </Link>
                      <h3>{product.name}</h3>
                    </motion.div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <motion.tr
                  key={feature.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="feature-label">{feature.label}</td>
                  {products.map((product) => (
                    <td key={product._id} className="feature-value">
                      {feature.format(product[feature.key])}
                    </td>
                  ))}
                </motion.tr>
              ))}
              <tr>
                <td className="feature-label">Actions</td>
                {products.map((product, index) => (
                  <td key={product._id}>
                    <motion.button
                      className="btn-add-cart"
                      onClick={() => handleAddToCart(product._id)}
                      disabled={product.stock === 0}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaShoppingCart />
                      <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                    </motion.button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
