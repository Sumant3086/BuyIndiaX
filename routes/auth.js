const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, invalidateUserCache } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPublicFields = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  membershipTier: user.membershipTier,
  loyaltyPoints: user.loyaltyPoints
});

// Register
router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email }).select('_id');
    if (existingUser) return res.status(400).json({ message: 'An account with this email already exists' });

    const user = await User.create({ name, email, password, role: 'user' });
    const token = signToken(user._id);

    res.status(201).json({ token, user: userPublicFields(user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // Check account lock
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutes = Math.ceil((user.accountLockedUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${minutes} minutes.` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed attempts and lock after 5
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const update = { failedLoginAttempts: failedAttempts };
      if (failedAttempts >= 5) {
        update.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
      }
      await User.findByIdAndUpdate(user._id, update);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Reset failed attempts on success
    await User.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      $unset: { accountLockedUntil: 1 },
      lastLogin: new Date()
    });

    const token = signToken(user._id);
    res.json({ token, user: userPublicFields(user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -twoFactorSecret -failedLoginAttempts')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const allowedFields = ['name', 'phone', 'address', 'birthday', 'preferences'];
    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true })
      .select('-password -twoFactorSecret');

    // Invalidate Redis cache so next request gets fresh data
    await invalidateUserCache(req.user._id);

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/change-password', auth, authLimiter, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain uppercase, lowercase, and a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = req.body.newPassword;
    await user.save();
    await invalidateUserCache(req.user._id);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout — invalidate Redis session cache
router.post('/logout', auth, async (req, res) => {
  try {
    await invalidateUserCache(req.user._id);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
