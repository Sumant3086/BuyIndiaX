/**
 * Barcode Service — pure JS, no external dependencies.
 * Generates EAN-13, EAN-8, and QR-payload strings.
 * Decodes/validates EAN-13 check digits.
 *
 * Frontend renders these using a library like JsBarcode or react-barcode.
 * The server provides the barcode string; the client renders the SVG.
 */

class BarcodeService {
  /**
   * Generate a valid EAN-13 barcode for a product.
   * Format: 890 (India country prefix) + 4-digit manufacturer + 5-digit product + 1 check digit
   *
   * @param {string|number} productId - MongoDB ObjectId or any unique ID
   * @param {string} categoryCode - 2-char category shortcode (optional)
   * @returns {string} 13-digit EAN-13 string
   */
  static generateEAN13(productId, categoryCode = '00') {
    // Extract numeric seed from productId string
    const idStr = productId.toString();
    let numericSeed = '';
    for (const char of idStr) {
      const code = char.charCodeAt(0);
      if (code >= 48 && code <= 57) numericSeed += char; // digit
      else numericSeed += (code % 10).toString(); // map letter to digit
    }

    // India GS1 prefix: 890
    const prefix = '890';

    // Category code (2 digits)
    const catCode = categoryCode.replace(/\D/g, '').padStart(2, '0').slice(0, 2);

    // Product reference: take last 7 digits from seed
    const productRef = numericSeed.slice(-7).padStart(7, '0').slice(0, 7);

    // Build 12-digit payload (prefix + cat + product)
    const payload = (prefix + catCode + productRef).slice(0, 12).padEnd(12, '0');

    // Compute EAN-13 check digit
    const checkDigit = BarcodeService.computeEAN13CheckDigit(payload);

    return payload + checkDigit;
  }

  /**
   * Compute EAN-13 check digit from 12-digit string.
   */
  static computeEAN13CheckDigit(digits12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = parseInt(digits12[i]);
      sum += i % 2 === 0 ? d : d * 3;
    }
    return ((10 - (sum % 10)) % 10).toString();
  }

  /**
   * Validate an EAN-13 barcode.
   */
  static validateEAN13(barcode) {
    if (!/^\d{13}$/.test(barcode)) return false;
    const expected = BarcodeService.computeEAN13CheckDigit(barcode.slice(0, 12));
    return barcode[12] === expected;
  }

  /**
   * Generate EAN-8 (for small packaging).
   */
  static generateEAN8(productId) {
    const idStr = productId.toString();
    let seed = '';
    for (const c of idStr) seed += (c.charCodeAt(0) % 10).toString();

    const payload = seed.slice(-7).padStart(7, '0').slice(0, 7);
    const check = BarcodeService.computeEAN8CheckDigit(payload);
    return payload + check;
  }

  static computeEAN8CheckDigit(digits7) {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const d = parseInt(digits7[i]);
      sum += i % 2 === 0 ? d * 3 : d;
    }
    return ((10 - (sum % 10)) % 10).toString();
  }

  /**
   * Generate a QR code payload string (structured data for product scanning).
   * The frontend passes this string to a QR library.
   */
  static generateQRPayload(product) {
    const data = {
      id: product._id.toString(),
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      category: product.category,
      unit: product.unit || 'piece'
    };
    return JSON.stringify(data);
  }

  /**
   * Generate a human-readable SKU code.
   * Format: CAT3-BRAND3-XXXXX (category prefix + brand prefix + 5-digit numeric)
   */
  static generateSKU(productName, category, brand = 'GEN') {
    const catCode = (category || 'GEN').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
    const brandCode = (brand || 'GEN').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
    const numCode = Date.now().toString().slice(-5);
    return `${catCode}-${brandCode}-${numCode}`;
  }

  /**
   * Parse a barcode string to identify its type.
   */
  static identify(barcode) {
    if (!barcode) return { type: 'unknown', valid: false };

    const clean = barcode.trim();
    if (/^\d{13}$/.test(clean)) {
      return { type: 'EAN-13', valid: BarcodeService.validateEAN13(clean), isIndian: clean.startsWith('890') };
    }
    if (/^\d{8}$/.test(clean)) {
      return { type: 'EAN-8', valid: true };
    }
    if (/^\d{12}$/.test(clean)) {
      return { type: 'UPC-A', valid: true };
    }
    if (clean.length > 20) {
      return { type: 'QR', valid: true };
    }
    return { type: 'unknown', valid: false };
  }

  /**
   * Batch-generate barcodes for products that don't have one.
   * Returns an array of { productId, barcode } objects.
   */
  static async assignMissingBarcodes(Product) {
    const productsWithoutBarcode = await Product.find({
      $or: [{ barcode: { $exists: false } }, { barcode: null }, { barcode: '' }]
    }).select('_id category brand name');

    const updates = [];
    for (const product of productsWithoutBarcode) {
      const categoryShort = (product.category || 'GEN').slice(0, 2).toUpperCase();
      const barcode = BarcodeService.generateEAN13(product._id, categoryShort);

      updates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { barcode } }
        }
      });
    }

    if (updates.length > 0) {
      await Product.bulkWrite(updates, { ordered: false });
    }

    return updates.map(op => ({
      productId: op.updateOne.filter._id,
      barcode: op.updateOne.update.$set.barcode
    }));
  }
}

module.exports = BarcodeService;
