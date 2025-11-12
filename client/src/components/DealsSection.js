import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './DealsSection.css';

const API_URL = 'http://localhost:5000/api';

const DealsSection = () => {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/deals/list`);
      setDeals(response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  if (deals.length === 0) return null;

  return (
    <section className="deals-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">🔥 Hot Deals</h2>
          <p className="section-subtitle">Limited time offers - Grab them before they're gone!</p>
        </div>
        <div className="deals-grid">
          {deals.slice(0, 6).map(product => (
            <Link key={product._id} to={`/products/${product._id}`} className="deal-card">
              <div className="discount-badge">{product.discount}% OFF</div>
              <img src={product.image} alt={product.name} />
              <div className="deal-content">
                <h3>{product.name}</h3>
                <div className="price-section">
                  <span className="current-price">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                <div className="rating">
                  {'⭐'.repeat(Math.round(product.rating))}
                  <span className="reviews">({product.numReviews})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
