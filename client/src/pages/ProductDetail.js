import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './ProductDetail.css';

const API_URL = 'http://localhost:5000/api';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await addToCart(product._id, quantity);
      alert('Product added to cart! 🛒');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) {
    return <div className="loading">Loading product...</div>;
  }

  if (!product) {
    return <div className="loading">Product not found</div>;
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-layout">
          <div className="product-image-section">
            <img src={product.image} alt={product.name} className="product-detail-image" />
          </div>

          <div className="product-info-section">
            <span className="product-category-badge">{product.category}</span>
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-rating-section">
              <span className="rating-stars">{'⭐'.repeat(Math.round(product.rating))}</span>
              <span className="rating-text">({product.numReviews} reviews)</span>
            </div>

            <div className="product-price-section">
              <span className="product-price">₹{product.price.toLocaleString()}</span>
              <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <p className="product-description">{product.description}</p>

            <div className="product-actions">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-control">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="qty-btn"
                  >
                    -
                  </button>
                  <span className="quantity">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="qty-btn"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAddToCart}
                className="btn btn-primary btn-lg btn-block"
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart 🛒'}
              </button>
            </div>

            <div className="product-features">
              <div className="feature-item">
                <span className="feature-icon">🚚</span>
                <span>Free Shipping</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">↩️</span>
                <span>30-Day Returns</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
