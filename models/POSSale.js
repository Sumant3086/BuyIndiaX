const mongoose = require('mongoose');

const posSaleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  barcode: String,
  quantity: { type: Number, required: true, min: 1 },
  mrp: Number,
  sellingPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['flat', 'percent'], default: 'flat' },
  lineTotal: Number,
  hsnCode: String,
  gstRate: Number,
  cgst: Number,
  sgst: Number,
  igst: Number,
  batchNumber: String
});

const posSaleSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'POSSession', required: true },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerPhone: String,
  customerName: String,
  items: [posSaleItemSchema],
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalCGST: { type: Number, default: 0 },
  totalSGST: { type: Number, default: 0 },
  totalIGST: { type: Number, default: 0 },
  totalGST: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  payments: [{
    method: { type: String, enum: ['cash', 'card', 'upi', 'wallet', 'store_credit'], required: true },
    amount: { type: Number, required: true },
    reference: String,
    cardLast4: String,
    upiId: String
  }],
  amountPaid: { type: Number, default: 0 },
  changeReturned: { type: Number, default: 0 },
  couponCode: String,
  couponDiscount: { type: Number, default: 0 },
  loyaltyPointsRedeemed: { type: Number, default: 0 },
  loyaltyPointsEarned: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'refunded', 'partially_refunded', 'void'], default: 'completed' },
  refundedAt: Date,
  refundReason: String,
  printCount: { type: Number, default: 0 }
}, { timestamps: true });

posSaleSchema.index({ billNumber: 1 });
posSaleSchema.index({ session: 1 });
posSaleSchema.index({ store: 1, createdAt: -1 });
posSaleSchema.index({ cashier: 1, createdAt: -1 });
posSaleSchema.index({ customer: 1 });

module.exports = mongoose.model('POSSale', posSaleSchema);
