import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchBar.css';

const API_URL = 'http://localhost:5000/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      const delayDebounce = setTimeout(() => {
        fetchSuggestions();
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/products?search=${query}&limit=5`);
      setSuggestions(response.data.products);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${query}`);
      setShowSuggestions(false);
      setQuery('');
    }
  };

  const handleSuggestionClick = (productId) => {
    navigate(`/products/${productId}`);
    setShowSuggestions(false);
    setQuery('');
  };

  return (
    <div className="search-container" ref={searchRef}>
      <form onSubmit={handleSearch} className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search for products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setShowSuggestions(true)}
        />
        <span className="search-icon" onClick={handleSearch}>🔍</span>
      </form>

      {showSuggestions && (
        <div className="search-suggestions">
          {suggestions.length > 0 ? (
            suggestions.map(product => (
              <div
                key={product._id}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(product._id)}
              >
                <img src={product.image} alt={product.name} className="suggestion-image" />
                <div className="suggestion-info">
                  <div className="suggestion-name">{product.name}</div>
                  <div className="suggestion-category">{product.category}</div>
                </div>
                <div className="suggestion-price">₹{product.price.toLocaleString()}</div>
              </div>
            ))
          ) : (
            <div className="no-results">No products found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
