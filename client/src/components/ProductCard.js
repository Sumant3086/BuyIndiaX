import React, { useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaShoppingCart, FaRegHeart, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import './ProductCard.css';

const formatPrice = (p) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

// Static star rating — no animations, pure CSS, accessible
const StarRating = memo(({ rating, count }) => {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (rating >= i + 1) return <FaStar key={i} className="star-filled" aria-hidden="true" />;
    if (rating >= i + 0.5) return <FaStarHalfAlt key={i} className="star-half" aria-hidden="true" />;
    return <FaRegStar key={i} className="star-empty" aria-hidden="true" />;
  });
  return (
    <div className="product-rating" aria-label={`${rating} out of 5 stars, ${count} reviews`}>
      <div className="stars" role="img">{stars}</div>
      {count > 0 && <span className="rating-count">({count})</span>}
    </div>
  );
});

const ProductCard = memo(({ product, onQuickView, onCompare }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { addToCart } = React.useContext(CartContext);
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const discountPct = product.discount ||
    (product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100) : 0);

  const isOutOfStock = product.stock === 0;
  const isLowStock = !isOutOfStock && product.stock < 10;

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { showToast('Please login to add items to cart', 'warning'); navigate('/login'); return; }
    try {
      await addToCart(product._id, 1);
      showToast('Added to cart', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add to cart', 'error');
    }
  }, [user, addToCart, product._id, navigate]);

  const handleWishlist = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { showToast('Please login to save items', 'warning'); navigate('/login'); return; }
    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${product._id}`);
        setIsWishlisted(false);
      } else {
        await api.post('/wishlist/add', { productId: product._id });
        setIsWishlisted(true);
        showToast('Saved to wishlist', 'success');
      }
    } catch { showToast('Could not update wishlist', 'error'); }
  }, [user, isWishlisted, product._id, navigate]);

  const imgSrc = !imgError && product.image ? product.image : `https://placehold.co/300x300/f1f5f9/94a3b8?text=${encodeURIComponent(product.name?.slice(0, 10) || 'Product')}`;

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-card-link" aria-label={product.name}>
        <div className="product-image-container">
          {/* Badges */}
          {(discountPct > 0 || product.isFeatured || product.isFlashSale) && (
            <div className="product-badges" aria-label="Product badges">
              {discountPct > 0 && <span className="badge badge-discount">{discountPct}% OFF</span>}
              {product.isFlashSale && <span className="badge badge-flash">Flash Sale</span>}
              {product.isFeatured && !product.isFlashSale && <span className="badge badge-featured">Featured</span>}
            </div>
          )}

          <img
            src={imgSrc}
            alt={product.name}
            className="product-image"
            loading="lazy"
            decoding="async"
            width="300"
            height="300"
            onError={() => setImgError(true)}
          />

          {isOutOfStock && (
            <div className="stock-overlay" aria-label="Out of stock">
              <span>Out of Stock</span>
            </div>
          )}

          {/* Quick actions — CSS hover only, no JS state */}
          <div className="quick-actions" role="group" aria-label="Quick actions">
            {onQuickView && (
              <button
                className="quick-action-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
                aria-label={`Quick view ${product.name}`}
                title="Quick View"
              >
                👁
              </button>
            )}
            {onCompare && (
              <button
                className="quick-action-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompare(product); }}
                aria-label={`Compare ${product.name}`}
                title="Compare"
              >
                ⇄
              </button>
            )}
          </div>

          {/* Wishlist */}
          <button
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlist}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            aria-pressed={isWishlisted}
          >
            {isWishlisted ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
          </button>
        </div>

        <div className="product-info">
          {product.brand && <span className="product-brand">{product.brand}</span>}
          <h3 className="product-name">{product.name}</h3>
          <StarRating rating={product.rating || 0} count={product.numReviews || 0} />

          <div className="product-price-section">
            <span className="current-price">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="original-price">
                <del>{formatPrice(product.originalPrice)}</del>
              </span>
            )}
          </div>

          {isLowStock && (
            <p className="stock-warning" role="status">
              Only {product.stock} left in stock
            </p>
          )}
        </div>
      </Link>

      <button
        className={`add-to-cart-btn ${isOutOfStock ? 'out-of-stock' : ''}`}
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
      >
        <FaShoppingCart aria-hidden="true" />
        <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
      </button>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;
