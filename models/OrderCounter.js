const mongoose = require('mongoose');

/**
 * OrderCounter — atomic sequential order number generator.
 * Uses findOneAndUpdate with $inc for race-condition-safe counter.
 */
const orderCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

orderCounterSchema.statics.nextOrderNumber = async function (prefix = 'BIX') {
  const counter = await this.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear().toString().slice(-2);
  return `${prefix}${year}${String(counter.seq).padStart(7, '0')}`;
};

module.exports = mongoose.model('OrderCounter', orderCounterSchema);
