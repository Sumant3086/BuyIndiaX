import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './Products.css';

const API_URL = 'http://localhost:5000/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState('');
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const categories = ['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;

      const response = await axios.get(`${API_URL}/products`, { params });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(productId, 1);
      alert('Product added to cart! 🛒');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    if (cat !== 'All') {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <h1>Discover Amazing Products 🛍️</h1>
          <p>Find exactly what you're looking for</p>
        </div>

        <div className="products-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${category === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>😔 No products found</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                <Link to={`/products/${product._id}`} className="product-image">
                  <img src={product.image} alt={product.name} />
                  {product.stock === 0 && <span className="out-of-stock">Out of Stock</span>}
                </Link>
                
                <div className="product-info">
                  <Link to={`/products/${product._id}`} className="product-name">
                    {product.name}
                  </Link>
                  <p className="product-category">{product.category}</p>
                  <div className="product-rating">
                    {'⭐'.repeat(Math.round(product.rating))}
                    <span>({product.numReviews})</span>
                  </div>
                  <div className="product-footer">
                    <span className="product-price">₹{product.price.toLocaleString()}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddToCart(product._id)}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart 🛒'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
