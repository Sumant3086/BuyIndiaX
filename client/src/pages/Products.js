import React, { useState, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { FaShoppingCart, FaSearch, FaStar, FaFilter, FaHeart } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { useProducts, usePrefetchProduct } from '../hooks/useProducts';
import { useAddToCart } from '../hooks/useCart';
import { useStore } from '../store/useStore';
import { showToast } from '../utils/toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import AnimatedSection from '../components/AnimatedSection';
import { cardVariants, staggerContainer } from '../theme/animations';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const { user } = useContext(AuthContext);
  
  const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];
  
  // Use TanStack Query for data fetching
  const filters = {};
  if (category !== 'All') filters.category = category;
  if (search) filters.search = search;
  
  const { data: products = [], isLoading, isError } = useProducts(filters);
  const addToCartMutation = useAddToCart();
  const prefetchProduct = usePrefetchProduct();
  const { addToWishlist, isInWishlist } = useStore();

  // Update search when URL params change
  React.useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategory = searchParams.get('category');
    if (urlSearch) setSearch(urlSearch);
    if (urlCategory) setCategory(urlCategory);
  }, [searchParams]);

  const handleAddToCart = (product) => {
    if (!user) {
      showToast('Please login to add items to cart', 'warning');
      return;
    }

    // Optimistic update
    addToCartMutation.mutate({ 
      productId: product._id, 
      quantity: 1,
      product 
    });
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    if (cat !== 'All') {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  const handleWishlist = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please login to add to wishlist', 'warning');
      return;
    }
    addToWishlist(product);
    showToast('Added to wishlist! ❤️', 'success');
  };

  return (
    <div className="products-page">
      <div className="container">
        <AnimatedSection animation="fadeInDown">
          <div className="products-header">
            <h1 className="gradient-text">Discover Amazing Products</h1>
            <p>Find exactly what you're looking for</p>
            <div className="header-decoration">
              <motion.div 
                className="decoration-orb orb-1"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div 
                className="decoration-orb orb-2"
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [360, 180, 0]
                }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={0.2}>
          <div className="products-filters">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="category-filters">
              <FaFilter className="filter-icon" />
              <LayoutGroup>
                {categories.map((cat, index) => (
                  <motion.button
                    key={cat}
                    layout
                    className={`category-btn ${category === cat ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, layout: { duration: 0.3 } }}
                  >
                    {cat}
                  </motion.button>
                ))}
              </LayoutGroup>
            </div>
          </div>
        </AnimatedSection>

        {isLoading ? (
          <div className="products-grid">
            {[...Array(6)].map((_, i) => (
              <LoadingSkeleton key={i} type="product" />
            ))}
          </div>
        ) : isError ? (
          <motion.div 
            className="error-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="error-icon">⚠️</span>
            <h3>Failed to load products</h3>
            <p>Please try again later</p>
          </motion.div>
        ) : products.length === 0 ? (
          <motion.div 
            className="no-products"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.span 
              className="empty-icon"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              😔
            </motion.span>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <motion.div 
            className="products-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {products.map((product, index) => (
                <motion.div 
                  key={product._id} 
                  className="product-card"
                  variants={cardVariants}
                  layout
                  whileHover={{ y: -8, scale: 1.02 }}
                  onMouseEnter={() => prefetchProduct(product._id)}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Link to={`/products/${product._id}`} className="product-image">
                    <motion.img 
                      src={product.image || 'https://via.placeholder.com/300x300?text=No+Image'} 
                      alt={product.name || 'Product'}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'; }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    />
                    <div className="image-overlay" />
                    
                    <motion.button
                      className="wishlist-btn"
                      onClick={(e) => handleWishlist(product, e)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaHeart className={isInWishlist(product._id) ? 'filled' : ''} />
                    </motion.button>
                    
                    {product.stock === 0 && (
                      <motion.span 
                        className="out-of-stock"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        Out of Stock
                      </motion.span>
                    )}
                    {product.stock > 0 && product.stock < 10 && (
                      <motion.span 
                        className="low-stock"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Only {product.stock} left!
                      </motion.span>
                    )}
                  </Link>
                  
                  <div className="product-info">
                    <Link to={`/products/${product._id}`} className="product-name">
                      {product.name || 'Unnamed Product'}
                    </Link>
                    <p className="product-category">{product.category || 'Other'}</p>
                    <div className="product-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < Math.round(product.rating || 0) ? 'star-filled' : 'star-empty'}
                          />
                        ))}
                      </div>
                      <span className="review-count">({product.numReviews || 0})</span>
                    </div>
                    <div className="product-footer">
                      <span className="product-price">₹{(product.price || 0).toLocaleString()}</span>
                      <motion.button
                        className="btn-add-cart"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0 || addToCartMutation.isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaShoppingCart />
                        {addToCartMutation.isLoading ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Products;
