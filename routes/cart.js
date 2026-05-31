const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const UrgencyMessaging = require('../utils/urgencyMessaging');
const StockReservationService = require('../utils/stockReservation');
const GSTCalculator = require('../utils/gstCalculator');

const buildCartResponse = async (cart, userId) => {
  const validItems = cart.items.filter(i => i.product);

  // Compute stock-aware availability for each item
  const itemsWithAvailability = await Promise.all(
    validItems.map(async (item) => {
      const stock = await StockReservationService.getAvailableStock(item.product._id);
      const sellingPrice = item.product.price * (1 - (item.product.discount || 0) / 100);
      const lineTotal = sellingPrice * item.quantity;
      return {
        ...item.toObject(),
        sellingPrice,
        lineTotal,
        availableStock: stock?.available ?? item.product.stock,
        isAvailable: (stock?.available ?? item.product.stock) >= item.quantity
      };
    })
  );

  const subtotal = itemsWithAvailability.reduce((sum, i) => sum + i.lineTotal, 0);

  // GST estimate for cart preview
  let gstPreview = { totalGST: 0, totalCGST: 0, totalSGST: 0 };
  try {
    const forGST = itemsWithAvailability.map(i => ({
      price: i.sellingPrice,
      quantity: i.quantity,
      category: i.product.category,
      hsnCode: i.product.hsnCode
    }));
    const calc = await GSTCalculator.calculateForOrder(forGST);
    gstPreview = { totalGST: calc.totalGST, totalCGST: calc.totalCGST, totalSGST: calc.totalSGST };
  } catch { /* GST optional in cart preview */ }

  const grandTotal = subtotal + gstPreview.totalGST;

  const urgency = UrgencyMessaging.getCartUrgencyMessage({
    totalAmount: subtotal,
    items: validItems,
    updatedAt: cart.updatedAt
  });

  return {
    _id: cart._id,
    user: userId,
    items: itemsWithAvailability,
    subtotal,
    gst: gstPreview,
    grandTotal,
    itemCount: itemsWithAvailability.reduce((s, i) => s + i.quantity, 0),
    urgencyMessages: urgency,
    updatedAt: cart.updatedAt
  };
};

// Get cart (single DB read, no unnecessary saves)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], totalAmount: 0 });
      return res.json({ _id: cart._id, user: userId, items: [], subtotal: 0, gst: {}, grandTotal: 0, itemCount: 0, urgencyMessages: [] });
    }

    // Remove items whose products were deleted
    const before = cart.items.length;
    cart.items = cart.items.filter(i => i.product);
    if (cart.items.length !== before) await cart.save();

    const response = await buildCartResponse(cart, userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to cart
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const qty = Math.max(1, parseInt(quantity));

    const product = await Product.findById(productId).select('name price stock discount category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock <= 0) return res.status(400).json({ message: 'Product is out of stock' });

    // Reservation-aware stock check
    const stockInfo = await StockReservationService.getAvailableStock(productId);
    if (!stockInfo || stockInfo.available < qty) {
      return res.status(400).json({
        message: `Only ${stockInfo?.available ?? 0} units available for "${product.name}"`
      });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const existingIdx = cart.items.findIndex(i => i.product.toString() === productId);
    if (existingIdx > -1) {
      const newQty = cart.items[existingIdx].quantity + qty;
      if (newQty > stockInfo.available) {
        return res.status(400).json({ message: `Cannot add more — only ${stockInfo.available} available` });
      }
      cart.items[existingIdx].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    // Placeholder — actual totals are computed in buildCartResponse
    cart.totalAmount = 0;

    await cart.save();
    await cart.populate('items.product');

    const response = await buildCartResponse(cart, userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item quantity
router.put('/:itemId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.user._id;
    const qty = parseInt(quantity);

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    if (qty <= 0) {
      cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    } else {
      const stockInfo = await StockReservationService.getAvailableStock(item.product);
      if (stockInfo && qty > stockInfo.available) {
        return res.status(400).json({ message: `Only ${stockInfo.available} units available` });
      }
      item.quantity = qty;
    }

    await cart.save();
    await cart.populate('items.product');
    const response = await buildCartResponse(cart, userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove single item
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.product');
    const response = await buildCartResponse(cart, userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.findOneAndUpdate({ user: userId }, { items: [], totalAmount: 0 });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
