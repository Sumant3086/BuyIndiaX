const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const { auth } = require('../middleware/auth');

// Get user wishlist
router.get('/', auth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products.product');
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
      await wishlist.save();
    }

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to wishlist
router.post('/add', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.some(
      item => item.product.toString() === productId
    );

    if (exists) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    wishlist.products.push({ product: productId });
    await wishlist.save();

    res.json({ message: 'Added to wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from wishlist
router.delete('/:productId', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      item => item.product.toString() !== req.params.productId
    );

    await wishlist.save();
    res.json({ message: 'Removed from wishlist', wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
