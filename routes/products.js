const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const { cache, invalidateCache } = require('../middleware/cache');
const UrgencyMessaging = require('../utils/urgencyMessaging');

const PRODUCT_CACHE_TTL = 180; // 3 min for listings
const PRODUCT_DETAIL_TTL = 300; // 5 min for detail pages

// Get all products with filtering, pagination, proper text search
router.get('/', cache(PRODUCT_CACHE_TTL), async (req, res) => {
  try {
    const {
      category, subcategory, search, brand, minPrice, maxPrice,
      sortBy = 'createdAt', order = 'desc',
      page = 1, limit = 20,
      inStock, isFeatured, isFlashSale, tags
    } = req.query;

    const query = {};
    let sortQuery = {};

    if (category && category !== 'All') query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (isFeatured === 'true') query.isFeatured = true;
    if (isFlashSale === 'true') { query.isFlashSale = true; query.flashSaleEndTime = { $gte: new Date() }; }
    if (tags) query.tags = { $in: tags.split(',').map(t => t.trim()) };

    // Use MongoDB text index for search (faster + relevance-scored)
    if (search && search.trim().length > 0) {
      query.$text = { $search: search.trim() };
      sortQuery = { score: { $meta: 'textScore' }, ...sortQuery };
    }

    const sortField = ['price', 'rating', 'views', 'salesCount', 'createdAt', 'discount'].includes(sortBy) ? sortBy : 'createdAt';
    if (!search || !search.trim()) {
      sortQuery[sortField] = order === 'asc' ? 1 : -1;
    }

    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const pageNum = parseInt(page) || 1;

    const projection = search?.trim() ? { score: { $meta: 'textScore' } } : {};

    const [products, count] = await Promise.all([
      Product.find(query, projection)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort(sortQuery),
      Product.countDocuments(query)
    ]);

    const productsWithUrgency = products.map(product => ({
      ...product.toObject(),
      urgencyMessages: UrgencyMessaging.getUrgencyMessage(product).slice(0, 2)
    }));

    res.json({
      products: productsWithUrgency,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search autocomplete (text index based, no cache — real-time)
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.trim().length === 0) return res.json([]);

    const products = await Product.find(
      { $text: { $search: q.trim() }, stock: { $gt: 0 } },
      { score: { $meta: 'textScore' } }
    )
      .select('name price image category rating numReviews barcode')
      .limit(parseInt(limit))
      .sort({ score: { $meta: 'textScore' } });

    res.json(products);
  } catch (error) {
    // Fallback to regex if text index not ready
    const { q, limit = 10 } = req.query;
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name price image category rating')
      .limit(parseInt(limit));
    res.json(products);
  }
});

// Featured products
router.get('/featured/list', cache(PRODUCT_CACHE_TTL), async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, stock: { $gt: 0 } }).limit(8);
    res.json(products.map(p => ({
      ...p.toObject(),
      urgencyMessages: UrgencyMessaging.getUrgencyMessage(p).slice(0, 1)
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Trending products
router.get('/trending/list', cache(PRODUCT_CACHE_TTL), async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0 } }).sort({ views: -1 }).limit(8);
    res.json(products.map(p => ({
      ...p.toObject(),
      urgencyMessages: UrgencyMessaging.getUrgencyMessage(p).slice(0, 1)
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Deals (products with discount)
router.get('/deals/list', cache(PRODUCT_CACHE_TTL), async (req, res) => {
  try {
    const products = await Product.find({ discount: { $gt: 0 }, stock: { $gt: 0 } })
      .sort({ discount: -1 }).limit(10);
    res.json(products.map(p => ({
      ...p.toObject(),
      urgencyMessages: UrgencyMessaging.getUrgencyMessage(p).slice(0, 2)
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Category breakdown for filters
router.get('/categories/summary', cache(600), async (req, res) => {
  try {
    const summary = await Product.aggregate([
      { $match: { stock: { $gt: 0 } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subcategories: { $addToSet: '$subcategory' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Product recommendations (same category)
router.get('/recommendations/:id', cache(PRODUCT_DETAIL_TTL), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const recommendations = await Product.find({
      _id: { $ne: req.params.id },
      category: product.category,
      stock: { $gt: 0 }
    })
      .sort({ rating: -1, salesCount: -1 })
      .limit(8)
      .select('name price originalPrice discount image rating numReviews stock');

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Flash sale products
router.get('/flash-sale/active', cache(30), async (req, res) => {
  try {
    const products = await Product.find({
      isFlashSale: true,
      flashSaleEndTime: { $gte: new Date() },
      stock: { $gt: 0 }
    }).sort({ flashSaleEndTime: 1 }).limit(12);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const urgencyMessages = UrgencyMessaging.getUrgencyMessage(product);
    const socialProof = UrgencyMessaging.getSocialProofMessage(product);

    res.json({ ...product.toObject(), urgencyMessages, socialProof });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    await invalidateCache('cache:GET:/api/products');
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Barcode already in use' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await invalidateCache('cache:GET:/api/products', `cache:GET:/api/products/${req.params.id}`);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await invalidateCache('cache:GET:/api/products', `cache:GET:/api/products/${req.params.id}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk update products (Admin)
router.put('/bulk/update', auth, adminAuth, async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    const bulkOps = updates.map(({ id, ...data }) => ({
      updateOne: { filter: { _id: id }, update: { $set: data }, upsert: false }
    }));

    const result = await Product.bulkWrite(bulkOps);
    await invalidateCache('cache:GET:/api/products');

    res.json({ message: 'Bulk update completed', modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
