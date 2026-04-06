import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './AdvancedFilters.css';

const AdvancedFilters = ({ onFilterChange, products = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 200000],
    categories: [],
    brands: [],
    ratings: [],
    inStock: false,
    sortBy: 'newest'
  });

  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    brand: true,
    rating: true
  });

  // Extract unique brands from products
  const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];
  const ratings = [5, 4, 3, 2, 1];

  useEffect(() => {
    onFilterChange(filters);
    // eslint-disable-next-line
  }, [filters]);

  const handlePriceChange = (index, value) => {
    const newRange = [...filters.priceRange];
    newRange[index] = parseInt(value);
    setFilters({ ...filters, priceRange: newRange });
  };

  const toggleCategory = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    setFilters({ ...filters, categories: newCategories });
  };

  const toggleBrand = (brand) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    setFilters({ ...filters, brands: newBrands });
  };

  const toggleRating = (rating) => {
    const newRatings = filters.ratings.includes(rating)
      ? filters.ratings.filter(r => r !== rating)
      : [...filters.ratings, rating];
    setFilters({ ...filters, ratings: newRatings });
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 200000],
      categories: [],
      brands: [],
      ratings: [],
      inStock: false,
      sortBy: 'newest'
    });
  };

  const activeFiltersCount = 
    filters.categories.length + 
    filters.brands.length + 
    filters.ratings.length + 
    (filters.inStock ? 1 : 0);

  return (
    <>
      {/* Mobile Filter Button */}
      <motion.button
        className="mobile-filter-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaFilter />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <motion.span
            className="filter-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {activeFiltersCount}
          </motion.span>
        )}
      </motion.button>

      {/* Filter Sidebar */}
      <AnimatePresence>
        {(isOpen || window.innerWidth > 768) && (
          <>
            {/* Mobile Backdrop */}
            {isOpen && window.innerWidth <= 768 && (
              <motion.div
                className="filter-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
            )}

            {/* Filter Panel */}
            <motion.div
              className="advanced-filters"
              initial={{ x: window.innerWidth <= 768 ? -300 : 0, opacity: window.innerWidth <= 768 ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="filters-header">
                <div className="header-content">
                  <FaFilter />
                  <h3>Filters</h3>
                  {activeFiltersCount > 0 && (
                    <span className="active-count">({activeFiltersCount})</span>
                  )}
                </div>
                <div className="header-actions">
                  {activeFiltersCount > 0 && (
                    <motion.button
                      className="clear-btn"
                      onClick={clearFilters}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear All
                    </motion.button>
                  )}
                  {window.innerWidth <= 768 && (
                    <button className="close-btn" onClick={() => setIsOpen(false)}>
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>

              {/* Sort By */}
              <div className="filter-section">
                <label className="filter-label">Sort By</label>
                <select
                  className="sort-select"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="filter-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('price')}
                >
                  <span>Price Range</span>
                  {expandedSections.price ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <AnimatePresence>
                  {expandedSections.price && (
                    <motion.div
                      className="section-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="price-inputs">
                        <div className="price-input-group">
                          <label>Min</label>
                          <input
                            type="number"
                            value={filters.priceRange[0]}
                            onChange={(e) => handlePriceChange(0, e.target.value)}
                            min="0"
                            max={filters.priceRange[1]}
                          />
                        </div>
                        <span className="price-separator">-</span>
                        <div className="price-input-group">
                          <label>Max</label>
                          <input
                            type="number"
                            value={filters.priceRange[1]}
                            onChange={(e) => handlePriceChange(1, e.target.value)}
                            min={filters.priceRange[0]}
                            max="200000"
                          />
                        </div>
                      </div>
                      <input
                        type="range"
                        className="price-slider"
                        min="0"
                        max="200000"
                        step="1000"
                        value={filters.priceRange[1]}
                        onChange={(e) => handlePriceChange(1, e.target.value)}
                      />
                      <div className="price-display">
                        ₹{filters.priceRange[0].toLocaleString()} - ₹{filters.priceRange[1].toLocaleString()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Categories */}
              <div className="filter-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('category')}
                >
                  <span>Categories</span>
                  {expandedSections.category ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <AnimatePresence>
                  {expandedSections.category && (
                    <motion.div
                      className="section-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {categories.map((category) => (
                        <motion.label
                          key={category}
                          className="checkbox-label"
                          whileHover={{ x: 4 }}
                        >
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => toggleCategory(category)}
                          />
                          <span>{category}</span>
                        </motion.label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Brands */}
              {uniqueBrands.length > 0 && (
                <div className="filter-section">
                  <button
                    className="section-header"
                    onClick={() => toggleSection('brand')}
                  >
                    <span>Brands</span>
                    {expandedSections.brand ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                  <AnimatePresence>
                    {expandedSections.brand && (
                      <motion.div
                        className="section-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        {uniqueBrands.map((brand) => (
                          <motion.label
                            key={brand}
                            className="checkbox-label"
                            whileHover={{ x: 4 }}
                          >
                            <input
                              type="checkbox"
                              checked={filters.brands.includes(brand)}
                              onChange={() => toggleBrand(brand)}
                            />
                            <span>{brand}</span>
                          </motion.label>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Ratings */}
              <div className="filter-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('rating')}
                >
                  <span>Ratings</span>
                  {expandedSections.rating ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <AnimatePresence>
                  {expandedSections.rating && (
                    <motion.div
                      className="section-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {ratings.map((rating) => (
                        <motion.label
                          key={rating}
                          className="checkbox-label"
                          whileHover={{ x: 4 }}
                        >
                          <input
                            type="checkbox"
                            checked={filters.ratings.includes(rating)}
                            onChange={() => toggleRating(rating)}
                          />
                          <span className="rating-option">
                            {'⭐'.repeat(rating)} & up
                          </span>
                        </motion.label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stock Availability */}
              <div className="filter-section">
                <motion.label
                  className="checkbox-label stock-checkbox"
                  whileHover={{ x: 4 }}
                >
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                  />
                  <span>In Stock Only</span>
                </motion.label>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdvancedFilters;
