import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import './Wishlist.css';

const API_URL = 'http://localhost:5000/api';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [user, navigate]);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWishlist();
    } catch (error) {
      alert('Failed to remove from wishlist');
    }
  };

  const moveToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(productId);
      alert('Moved to cart! 🛒');
    } catch (error) {
      alert('Failed to move to cart');
    }
  };

  if (loading) return <div className="loading">Loading wishlist...</div>;

  return (
    <div className="wishlist-page">
      <div className="container">
        <h1 className="page-title">My Wishlist ❤️</h1>
        
        {!wishlist || wishlist.products.length === 0 ? (
          <div className="empty-wishlist">
            <span className="empty-icon">💔</span>
            <h2>Your wishlist is empty</h2>
            <p>Add products you love to your wishlist</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.products.map(item => (
              <div key={item.product._id} className="wishlist-card">
                <button 
                  className="remove-btn"
                  onClick={() => removeFromWishlist(item.product._id)}
                >
                  ✕
                </button>
                <Link to={`/products/${item.product._id}`}>
                  <img src={item.product.image} alt={item.product.name} />
                </Link>
                <div className="wishlist-card-content">
                  <Link to={`/products/${item.product._id}`}>
                    <h3>{item.product.name}</h3>
                  </Link>
                  <p className="price">₹{item.product.price.toLocaleString()}</p>
                  <div className="rating">
                    {'⭐'.repeat(Math.round(item.product.rating))}
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => moveToCart(item.product._id)}
                  >
                    Move to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
