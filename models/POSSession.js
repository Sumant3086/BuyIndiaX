const mongoose = require('mongoose');

const posSessionSchema = new mongoose.Schema({
  sessionNumber: { type: String, required: true, unique: true },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  terminal: { type: String, default: 'POS-01' },
  status: { type: String, enum: ['open', 'suspended', 'closed'], default: 'open' },
  openingCash: { type: Number, default: 0 },
  closingCash: { type: Number, default: 0 },
  expectedCash: { type: Number, default: 0 },
  cashDifference: { type: Number, default: 0 },
  openedAt: { type: Date, default: Date.now },
  closedAt: Date,
  summary: {
    totalSales: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    totalCashSales: { type: Number, default: 0 },
    totalCardSales: { type: Number, default: 0 },
    totalUPISales: { type: Number, default: 0 },
    totalRefunds: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalGST: { type: Number, default: 0 },
    itemsSold: { type: Number, default: 0 }
  },
  notes: String
}, { timestamps: true });

posSessionSchema.index({ cashier: 1, status: 1 });
posSessionSchema.index({ store: 1, openedAt: -1 });

module.exports = mongoose.model('POSSession', posSessionSchema);
