const express = require('express');
const router = express.Router();
const Comparison = require('../models/Comparison');
const { auth } = require('../middleware/auth');

// Get user's comparison list
router.get('/', auth, async (req, res) => {
  try {
    let comparison = await Comparison.findOne({ user: req.user._id })
      .populate('products');

    if (!comparison) {
      comparison = new Comparison({ user: req.user._id, products: [] });
      await comparison.save();
    }

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add product to comparison
router.post('/add', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    let comparison = await Comparison.findOne({ user: req.user._id });

    if (!comparison) {
      comparison = new Comparison({ user: req.user._id, products: [] });
    }

    // Limit to 4 products for comparison
    if (comparison.products.length >= 4) {
      return res.status(400).json({ message: 'Maximum 4 products can be compared' });
    }

    // Check if already added
    if (comparison.products.includes(productId)) {
      return res.status(400).json({ message: 'Product already in comparison' });
    }

    comparison.products.push(productId);
    await comparison.save();
    await comparison.populate('products');

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove product from comparison
router.delete('/:productId', auth, async (req, res) => {
  try {
    const comparison = await Comparison.findOne({ user: req.user._id });

    if (!comparison) {
      return res.status(404).json({ message: 'Comparison list not found' });
    }

    comparison.products = comparison.products.filter(
      id => id.toString() !== req.params.productId
    );

    await comparison.save();
    await comparison.populate('products');

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear comparison list
router.delete('/', auth, async (req, res) => {
  try {
    await Comparison.findOneAndUpdate(
      { user: req.user._id },
      { products: [] },
      { new: true }
    );

    res.json({ message: 'Comparison list cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
