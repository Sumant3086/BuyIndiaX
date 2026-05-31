import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { getFallbackImage, handleImageError } from '../utils/imageHelper';
import RecentlyViewed, { addToRecentlyViewed } from '../components/RecentlyViewed';
import UrgencyBadge from '../components/UrgencyBadge';
import SEOMeta from '../components/SEOMeta';
import { ProductDetailSkeleton } from '../components/LoadingSkeleton';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    setNotFound(false);

    // Fire all requests in parallel — don't wait sequentially
    const [productRes, reviewsRes, recsRes, wishlistRes] = await Promise.allSettled([
      api.get(`/products/${id}`),
      api.get(`/reviews/product/${id}`),
      api.get(`/products/recommendations/${id}`),
      user ? api.get('/wishlist') : Promise.resolve(null)
    ]);

    if (productRes.status === 'fulfilled') {
      const p = productRes.value.data;
      setProduct(p);
      addToRecentlyViewed(p);
    } else {
      setNotFound(true);
    }

    if (reviewsRes.status === 'fulfilled') {
      setReviews(reviewsRes.value.data || []);
    }

    if (recsRes.status === 'fulfilled') {
      setRecommendations((recsRes.value.data || []).map(r => ({
        ...r, image: r.image || getFallbackImage(r.category)
      })));
    }

    if (wishlistRes?.status === 'fulfilled' && wishlistRes.value) {
      const exists = wishlistRes.value.data.products?.some(
        item => (item.product?._id || item.product) === id
      );
      setInWishlist(!!exists);
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please login to add items to cart', 'warning');
      navigate('/login');
      return;
    }

    try {
      await addToCart(product._id, quantity);
      showToast('Product added to cart! 🛒', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add to cart', 'error');
    }
  };

  const toggleWishlist = async () => {
    if (!user) { showToast('Please login to save items', 'warning'); navigate('/login'); return; }
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${id}`);
        setInWishlist(false);
        showToast('Removed from wishlist', 'info');
      } else {
        await api.post('/wishlist/add', { productId: id });
        setInWishlist(true);
        showToast('Saved to wishlist', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update wishlist', 'error');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { showToast('Please write a comment', 'warning'); return; }
    if (!user) { showToast('Please login to review', 'warning'); navigate('/login'); return; }

    try {
      await api.post('/reviews', { productId: id, rating, comment });
      showToast('Review submitted!', 'success');
      setComment('');
      setRating(5);
      api.get(`/reviews/product/${id}`).then(r => setReviews(r.data || []));
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit review';
      if (errorMessage.includes('already reviewed')) {
        showToast('You have already reviewed this product', 'info');
      } else {
        showToast(errorMessage, 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container"><ProductDetailSkeleton /></div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="product-detail-page">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>Product not found</h2>
          <p style={{ color: '#64748b', margin: '0.5rem 0 1.5rem' }}>
            This product may have been removed or is no longer available.
          </p>
          <a href="/products" className="btn btn-primary">Browse Products</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title={product.name}
        description={product.description?.slice(0, 155) || `Buy ${product.name} on BuyIndiaX`}
        image={product.image}
        type="product"
        price={product.price}
        availability={product.stock > 0 ? 'in_stock' : 'out_of_stock'}
      />
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-layout">
          <div className="product-image-section">
            <img
              src={imgError ? getFallbackImage(product.category) : (product.image || getFallbackImage(product.category))}
              alt={product.name || 'Product'}
              className="product-detail-image"
              loading="eager"
              onError={() => setImgError(true)}
            />
          </div>

          <div className="product-info-section">
            <span className="product-category-badge">{product.category}</span>
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-rating-section">
              <span className="rating-stars">{'⭐'.repeat(Math.round(product.rating))}</span>
              <span className="rating-text">({product.numReviews} reviews)</span>
            </div>

            {/* Urgency Messages */}
            {product.urgencyMessages && product.urgencyMessages.length > 0 && (
              <UrgencyBadge messages={product.urgencyMessages} />
            )}

            {/* Social Proof */}
            {product.socialProof && product.socialProof.length > 0 && (
              <UrgencyBadge messages={product.socialProof} />
            )}

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
                <div
                  key={rec._id}
                  className="recommendation-card"
                  onClick={() => {
                    navigate(`/products/${rec._id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  <img
                    src={rec.image || getFallbackImage(rec.category)}
                    alt={rec.name}
                    onError={(e) => handleImageError(e, rec.category)}
                  />
                  <h4>{rec.name}</h4>
                  <p className="price">₹{rec.price?.toLocaleString() || '0'}</p>
                  <span className="rating">
                    {'⭐'.repeat(Math.round(rec.rating || 0))}
                    {rec.rating ? ` ${rec.rating.toFixed(1)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Recently Viewed Sidebar */}
      <RecentlyViewed />
    </div>
    </>
  );
};

export default ProductDetail;
