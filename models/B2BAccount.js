const mongoose = require('mongoose');

const b2bAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['Retailer', 'Wholesaler', 'Distributor', 'Restaurant', 'Hotel', 'Institution', 'Other'],
    required: true
  },
  taxId: {
    type: String,
    required: true,
    unique: true
  },
  businessLicense: {
    type: String
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  creditUsed: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['Net-15', 'Net-30', 'Net-60', 'Net-90', 'Prepaid'],
    default: 'Prepaid'
  },
  discountTier: {
    type: String,
    enum: ['Standard', 'Silver', 'Gold', 'Platinum'],
    default: 'Standard'
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 50
  },
  minimumOrderValue: {
    type: Number,
    default: 0
  },
  accountManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  shippingAddresses: [{
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  }],
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    designation: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['License', 'Tax Certificate', 'Registration', 'Other']
    },
    url: String,
    uploadedAt: Date
  }],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Suspended', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  lastOrderDate: Date,
  notes: String
}, {
  timestamps: true
});

// Calculate available credit
b2bAccountSchema.virtual('availableCredit').get(function() {
  return this.creditLimit - this.creditUsed;
});

// Check if account can place order
b2bAccountSchema.methods.canPlaceOrder = function(orderValue) {
  if (this.status !== 'Approved') return false;
  if (this.paymentTerms === 'Prepaid') return true;
  return this.availableCredit >= orderValue;
};

// Calculate discount for order
b2bAccountSchema.methods.calculateDiscount = function(subtotal) {
  if (subtotal < this.minimumOrderValue) return 0;
  return (subtotal * this.discountPercentage) / 100;
};

// Update purchase statistics
b2bAccountSchema.methods.updatePurchaseStats = async function(orderValue) {
  this.totalPurchases += orderValue;
  this.totalOrders += 1;
  this.averageOrderValue = this.totalPurchases / this.totalOrders;
  this.lastOrderDate = new Date();
  
  if (this.paymentTerms !== 'Prepaid') {
    this.creditUsed += orderValue;
  }
  
  await this.save();
};

module.exports = mongoose.model('B2BAccount', b2bAccountSchema);
