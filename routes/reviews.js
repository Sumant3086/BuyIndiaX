const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add review
router.post('/', auth, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    const existingReview = await Review.findOne({ 
      product: productId, 
      user: req.user._id 
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = new Review({
      product: productId,
      user: req.user._id,
      rating,
      comment
    });

    await review.save();

    // Update product rating
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews: reviews.length
    });

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark review as helpful
router.put('/:id/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
