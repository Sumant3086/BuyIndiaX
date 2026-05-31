const GSTRate = require('../models/GSTRate');

/**
 * GST Calculator for Indian tax compliance.
 * Supports CGST+SGST (intra-state) and IGST (inter-state) calculation.
 */
class GSTCalculator {
  /**
   * Fetch GST rate for a category/HSN code.
   */
  static async getRate(category, hsnCode = null) {
    const query = { $or: [] };
    if (hsnCode) query.$or.push({ hsnCode });
    if (category) query.$or.push({ category });

    if (!query.$or.length) return { cgst: 0, sgst: 0, igst: 0, cess: 0, isExempt: true };

    const rate = await GSTRate.findOne(query).sort({ hsnCode: -1 });

    if (!rate || rate.isExempt) return { cgst: 0, sgst: 0, igst: 0, cess: 0, isExempt: true };

    return {
      cgst: rate.cgstRate,
      sgst: rate.sgstRate,
      igst: rate.igstRate,
      cess: rate.cessRate || 0,
      isExempt: false
    };
  }

  /**
   * Calculate GST on a line item.
   * @param {number} price - Selling price (inclusive or exclusive of GST)
   * @param {number} cgstRate - CGST %
   * @param {number} sgstRate - SGST %
   * @param {boolean} priceInclusive - If true, back-calculate GST from inclusive price
   * @param {boolean} isInterState - If true, use IGST instead of CGST+SGST
   */
  static calculate(price, cgstRate, sgstRate, { priceInclusive = false, isInterState = false } = {}) {
    const igstRate = cgstRate + sgstRate;

    if (priceInclusive) {
      const rate = isInterState ? igstRate : igstRate;
      const basePrice = price / (1 + rate / 100);
      const gst = price - basePrice;
      return {
        basePrice: Math.round(basePrice * 100) / 100,
        cgst: isInterState ? 0 : Math.round((basePrice * cgstRate / 100) * 100) / 100,
        sgst: isInterState ? 0 : Math.round((basePrice * sgstRate / 100) * 100) / 100,
        igst: isInterState ? Math.round(gst * 100) / 100 : 0,
        totalGST: Math.round(gst * 100) / 100,
        totalWithGST: price
      };
    }

    const cgst = Math.round(price * cgstRate / 100 * 100) / 100;
    const sgst = Math.round(price * sgstRate / 100 * 100) / 100;
    const igst = isInterState ? Math.round(price * igstRate / 100 * 100) / 100 : 0;

    return {
      basePrice: price,
      cgst: isInterState ? 0 : cgst,
      sgst: isInterState ? 0 : sgst,
      igst,
      totalGST: isInterState ? igst : cgst + sgst,
      totalWithGST: price + (isInterState ? igst : cgst + sgst)
    };
  }

  /**
   * Calculate GST for a full cart/order.
   * @param {Array} items - [{ price, quantity, category, hsnCode }]
   * @param {boolean} isInterState
   */
  static async calculateForOrder(items, isInterState = false) {
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let taxableAmount = 0;

    const breakdown = await Promise.all(
      items.map(async (item) => {
        const rates = await GSTCalculator.getRate(item.category, item.hsnCode);
        const lineTotal = item.price * item.quantity;
        const gst = GSTCalculator.calculate(lineTotal, rates.cgst, rates.sgst, { isInterState });

        totalCGST += gst.cgst;
        totalSGST += gst.sgst;
        totalIGST += gst.igst;
        taxableAmount += lineTotal;

        return {
          ...item,
          cgstRate: rates.cgst,
          sgstRate: rates.sgst,
          igstRate: rates.igst,
          cgst: gst.cgst,
          sgst: gst.sgst,
          igst: gst.igst,
          totalGST: gst.totalGST
        };
      })
    );

    return {
      items: breakdown,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      totalCGST: Math.round(totalCGST * 100) / 100,
      totalSGST: Math.round(totalSGST * 100) / 100,
      totalIGST: Math.round(totalIGST * 100) / 100,
      totalGST: Math.round((totalCGST + totalSGST + totalIGST) * 100) / 100,
      grandTotal: Math.round((taxableAmount + totalCGST + totalSGST + totalIGST) * 100) / 100
    };
  }

  /**
   * Seed default Indian GST rates for common retail categories.
   */
  static async seedDefaultRates() {
    const defaults = [
      { category: 'Fresh Produce', subcategory: 'Vegetables', hsnCode: '0701', cgstRate: 0, sgstRate: 0, igstRate: 0, isExempt: true, description: 'Fresh vegetables - GST exempt' },
      { category: 'Fresh Produce', subcategory: 'Fruits', hsnCode: '0803', cgstRate: 0, sgstRate: 0, igstRate: 0, isExempt: true, description: 'Fresh fruits - GST exempt' },
      { category: 'Fresh Produce', subcategory: 'Meat', hsnCode: '0201', cgstRate: 0, sgstRate: 0, igstRate: 0, isExempt: true, description: 'Fresh meat - GST exempt' },
      { category: 'Fresh Produce', subcategory: 'Dairy', hsnCode: '0401', cgstRate: 0, sgstRate: 0, igstRate: 0, isExempt: false, description: 'Milk, curd, lassi - exempt; packaged may attract 5%' },
      { category: 'Fresh Produce', subcategory: 'Fish & Seafood', hsnCode: '0302', cgstRate: 0, sgstRate: 0, igstRate: 0, isExempt: true, description: 'Fresh fish - GST exempt' },
      { category: 'Grocery', subcategory: 'Staples', hsnCode: '1001', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, isExempt: false, description: 'Packaged grains, flour - 5%' },
      { category: 'Grocery', subcategory: 'Snacks', hsnCode: '1905', cgstRate: 9, sgstRate: 9, igstRate: 18, isExempt: false, description: 'Biscuits, pastries - 18%' },
      { category: 'Grocery', subcategory: 'Canned Goods', hsnCode: '2005', cgstRate: 6, sgstRate: 6, igstRate: 12, isExempt: false, description: 'Canned / preserved food - 12%' },
      { category: 'Grocery', subcategory: 'Sauces & Condiments', hsnCode: '2103', cgstRate: 6, sgstRate: 6, igstRate: 12, isExempt: false, description: 'Sauces, ketchup - 12%' },
      { category: 'Beverages', subcategory: 'Soft Drinks', hsnCode: '2202', cgstRate: 14, sgstRate: 14, igstRate: 28, cessRate: 12, isExempt: false, description: 'Carbonated drinks - 28% + 12% cess' },
      { category: 'Beverages', subcategory: 'Juices & Water', hsnCode: '2009', cgstRate: 6, sgstRate: 6, igstRate: 12, isExempt: false, description: 'Fruit juices - 12%' },
      { category: 'Beverages', subcategory: 'Tea & Coffee', hsnCode: '0902', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, isExempt: false, description: 'Tea, coffee - 5%' },
      { category: 'Health & Beauty', subcategory: 'Skincare', hsnCode: '3304', cgstRate: 9, sgstRate: 9, igstRate: 18, isExempt: false, description: 'Beauty / skincare - 18%' },
      { category: 'Health & Beauty', subcategory: 'Hair Care', hsnCode: '3305', cgstRate: 9, sgstRate: 9, igstRate: 18, isExempt: false, description: 'Hair care - 18%' },
      { category: 'Health & Beauty', subcategory: 'Healthcare', hsnCode: '3004', cgstRate: 6, sgstRate: 6, igstRate: 12, isExempt: false, description: 'Medicines - 12%' },
      { category: 'Non-Food Items', subcategory: 'Electronics', hsnCode: '8517', cgstRate: 9, sgstRate: 9, igstRate: 18, isExempt: false, description: 'Electronics - 18%' },
      { category: 'Non-Food Items', subcategory: 'Cleaning Products', hsnCode: '3402', cgstRate: 9, sgstRate: 9, igstRate: 18, isExempt: false, description: 'Detergents / cleaners - 18%' }
    ];

    for (const rate of defaults) {
      await GSTRate.findOneAndUpdate(
        { category: rate.category, subcategory: rate.subcategory },
        rate,
        { upsert: true, new: true }
      );
    }

    console.log('GST rates seeded successfully');
  }
}

module.exports = GSTCalculator;
