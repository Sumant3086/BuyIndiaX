const express = require('express');
const router = express.Router();
const SavedSearch = require('../models/SavedSearch');
const { auth } = require('../middleware/auth');

// Get user's saved searches
router.get('/', auth, async (req, res) => {
  try {
    const savedSearches = await SavedSearch.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(savedSearches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create saved search
router.post('/', auth, async (req, res) => {
  try {
    const { name, filters, notifyOnNewResults } = req.body;

    const savedSearch = new SavedSearch({
      user: req.user._id,
      name,
      filters,
      notifyOnNewResults
    });

    await savedSearch.save();
    res.status(201).json(savedSearch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update saved search
router.put('/:id', auth, async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!savedSearch) {
      return res.status(404).json({ message: 'Saved search not found' });
    }

    res.json(savedSearch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete saved search
router.delete('/:id', auth, async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!savedSearch) {
      return res.status(404).json({ message: 'Saved search not found' });
    }

    res.json({ message: 'Saved search deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Execute saved search
router.get('/:id/execute', auth, async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!savedSearch) {
      return res.status(404).json({ message: 'Saved search not found' });
    }

    const Product = require('../models/Product');
    const { filters } = savedSearch;
    
    const query = {};
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    if (filters.category) query.category = filters.category;
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }
    if (filters.minRating) query.rating = { $gte: filters.minRating };
    if (filters.brands && filters.brands.length > 0) {
      query.brand = { $in: filters.brands };
    }
    if (filters.inStock) query.stock = { $gt: 0 };

    const sortOptions = {};
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          sortOptions.price = 1;
          break;
        case 'price_desc':
          sortOptions.price = -1;
          break;
        case 'rating':
          sortOptions.rating = -1;
          break;
        case 'newest':
          sortOptions.createdAt = -1;
          break;
        case 'popular':
          sortOptions.views = -1;
          break;
        default:
          sortOptions.createdAt = -1;
      }
    }

    const products = await Product.find(query).sort(sortOptions).limit(50);

    res.json({ savedSearch, products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
