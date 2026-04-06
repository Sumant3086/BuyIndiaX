import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaClock, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { fadeInDown, staggerContainer, staggerItem } from '../theme/animations';
import './SearchAutocomplete.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SearchAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [groupedSuggestions, setGroupedSuggestions] = useState({});
  const [searchHistory, setSearchHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);

    // Click outside to close
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      const debounce = setTimeout(() => {
        fetchSuggestions();
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/search`, {
        params: { q: query, limit: 10 }
      });
      setSuggestions(response.data);
      
      // Group suggestions by category
      const grouped = response.data.reduce((acc, product) => {
        const category = product.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(product);
        return acc;
      }, {});
      setGroupedSuggestions(grouped);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) return;

    // Add to search history
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    setSearchHistory(newHistory);

    // Navigate to products page with search query
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleSuggestionClick = (product) => {
    navigate(`/products/${product._id}`);
    setQuery('');
    setIsOpen(false);
  };

  const clearHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  const removeHistoryItem = (item) => {
    const newHistory = searchHistory.filter(h => h !== item);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    setSearchHistory(newHistory);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    const totalItems = suggestions.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleCategoryFilter = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="search-autocomplete" ref={searchRef}>
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onKeyPress={(e) => e.key === 'Enter' && selectedIndex === -1 && handleSearch(query)}
        />
        {query && (
          <motion.button
            className="clear-search-btn"
            onClick={() => setQuery('')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaTimes />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query || searchHistory.length > 0) && (
          <motion.div
            className="search-dropdown"
            variants={fadeInDown}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Search History */}
            {!query && searchHistory.length > 0 && (
              <div className="search-section">
                <div className="section-header">
                  <h4><FaClock /> Recent Searches</h4>
                  <button className="clear-history-btn" onClick={clearHistory}>
                    Clear All
                  </button>
                </div>
                <motion.div
                  className="history-list"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {searchHistory.map((item, index) => (
                    <motion.div
                      key={index}
                      className="history-item"
                      variants={staggerItem}
                      onClick={() => handleSearch(item)}
                    >
                      <FaClock className="history-icon" />
                      <span>{item}</span>
                      <button
                        className="remove-history-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistoryItem(item);
                        }}
                      >
                        <FaTimes />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Suggestions with Category Grouping */}
            {query && (
              <div className="search-section">
                {loading ? (
                  <div className="search-loading">
                    <div className="spinner"></div>
                    <span>Searching...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {Object.entries(groupedSuggestions).map(([category, products]) => (
                      <div key={category} className="category-group">
                        <div className="category-header">
                          <h4>{category}</h4>
                          <button 
                            className="view-all-btn"
                            onClick={() => handleCategoryFilter(category)}
                          >
                            View All
                          </button>
                        </div>
                        <div className="suggestions-list">
                          {products.map((product, index) => {
                            const globalIndex = suggestions.findIndex(p => p._id === product._id);
                            return (
                              <motion.div
                                key={product._id}
                                className={`suggestion-item ${selectedIndex === globalIndex ? 'selected' : ''}`}
                                variants={staggerItem}
                                onClick={() => handleSuggestionClick(product)}
                                whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                              >
                                <img src={product.image} alt={product.name} />
                                <div className="suggestion-info">
                                  <h5>{product.name}</h5>
                                  <p className="suggestion-category">{product.category}</p>
                                  <p className="suggestion-price">₹{product.price.toLocaleString()}</p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="no-results">
                    <p>No products found for "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchAutocomplete;
