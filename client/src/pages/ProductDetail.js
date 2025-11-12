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
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchRecommendations();
    checkWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/product/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/recommendations/${id}`);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const checkWishlist = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const exists = response.data.products.some(item => item.product._id === id);
      setInWishlist(exists);
    } catch (error) {
      console.error('Error checking wishlist:', error);
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

  const toggleWishlist = async () => {
    if (!user) {
      alert('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (inWishlist) {
        await axios.delete(`${API_URL}/wishlist/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInWishlist(false);
        alert('Removed from wishlist');
      } else {
        await axios.post(`${API_URL}/wishlist/add`, 
          { productId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setInWishlist(true);
        alert('Added to wishlist! ❤️');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to submit a review');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/reviews`, 
        { productId: id, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Review submitted! ⭐');
      setComment('');
      setRating(5);
      fetchReviews();
      fetchProduct();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review');
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

              <div className="action-buttons">
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary btn-lg"
                  disabled={product.stock === 0}
                  style={{ flex: 1 }}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart 🛒'}
                </button>
                <button 
                  onClick={toggleWishlist}
                  className={`btn btn-outline btn-lg ${inWishlist ? 'active' : ''}`}
                  style={{ width: '60px' }}
                >
                  {inWishlist ? '❤️' : '🤍'}
                </button>
              </div>
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

        {/* Reviews Section */}
        <div className="reviews-section">
          <h2>Customer Reviews</h2>
          
          {user && (
            <form onSubmit={submitReview} className="review-form">
              <h3>Write a Review</h3>
              <div className="rating-input">
                <label>Rating:</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                  <option value="4">⭐⭐⭐⭐ Good</option>
                  <option value="3">⭐⭐⭐ Average</option>
                  <option value="2">⭐⭐ Poor</option>
                  <option value="1">⭐ Terrible</option>
                </select>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                required
                rows="4"
              />
              <button type="submit" className="btn btn-primary">Submit Review</button>
            </form>
          )}

          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <span className="reviewer-name">👤 {review.user.name}</span>
                    <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2>You May Also Like</h2>
            <div className="recommendations-grid">
              {recommendations.map(rec => (
                <div key={rec._id} className="recommendation-card" onClick={() => navigate(`/products/${rec._id}`)}>
                  <img src={rec.image} alt={rec.name} />
                  <h4>{rec.name}</h4>
                  <p className="price">₹{rec.price.toLocaleString()}</p>
                  <span className="rating">{'⭐'.repeat(Math.round(rec.rating))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
