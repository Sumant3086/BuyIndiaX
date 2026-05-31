const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager', 'inventory_staff', 'sales_staff', 'support_staff'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'view_products', 'manage_products', 'view_orders', 'manage_orders',
      'view_inventory', 'manage_inventory', 'view_analytics', 'manage_users',
      'manage_coupons', 'view_customers', 'manage_customers', 'process_refunds'
    ]
  }],
  department: {
    type: String,
    enum: ['sales', 'inventory', 'customer_service', 'management', 'admin'],
    default: 'sales'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phone: String,
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  membershipTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  badges: [{
    name: String,
    earnedAt: Date,
    icon: String
  }],
  preferences: {
    darkMode: {
      type: Boolean,
      default: false
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  recentlyViewed: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  searchHistory: [{
    query: String,
    searchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: Date,
  lastLogin: Date,
  birthday: Date,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String
}, {
  timestamps: true
});

// Performance indexes
userSchema.index({ email: 1 }); // already unique, but explicit for explain plans
userSchema.index({ role: 1 }); // for admin queries
userSchema.index({ membershipTier: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12); // cost 12 in production
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code
userSchema.methods.generateReferralCode = function() {
  if (!this.referralCode) {
    this.referralCode = `REF${this._id.toString().slice(-8).toUpperCase()}`;
  }
  return this.referralCode;
};

module.exports = mongoose.model('User', userSchema);
