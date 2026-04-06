const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  filters: {
    search: String,
    category: String,
    minPrice: Number,
    maxPrice: Number,
    minRating: Number,
    brands: [String],
    inStock: Boolean,
    sortBy: String
  },
  notifyOnNewResults: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
