const Product = require('../models/Product');

/**
 * FIFO/FEFO Inventory Management System
 * Implements First-In-First-Out and First-Expiry-First-Out logic
 */

class InventoryManager {
  /**
   * Deduct stock using FIFO or FEFO method
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to deduct
   * @returns {Object} - Deduction details
   */
  static async deductStock(productId, quantity) {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    // If no batches, use simple stock deduction
    if (!product.inventoryBatches || product.inventoryBatches.length === 0) {
      product.stock -= quantity;
      await product.save();
      return { 
        success: true, 
        method: 'simple',
        deducted: quantity,
        remainingStock: product.stock
      };
    }

    // Apply FIFO or FEFO logic
    const method = product.inventoryMethod || 'FIFO';
    let remainingToDeduct = quantity;
    const deductedBatches = [];

    // Sort batches based on method
    let sortedBatches = [...product.inventoryBatches];
    
    if (method === 'FIFO') {
      // First In First Out - oldest purchase date first
      sortedBatches.sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));
    } else if (method === 'FEFO') {
      // First Expiry First Out - earliest expiry date first
      sortedBatches.sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });
    } else if (method === 'LIFO') {
      // Last In First Out - newest purchase date first
      sortedBatches.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
    }

    // Deduct from batches
    for (let i = 0; i < sortedBatches.length && remainingToDeduct > 0; i++) {
      const batch = sortedBatches[i];
      
      if (batch.quantity > 0) {
        const deductFromBatch = Math.min(batch.quantity, remainingToDeduct);
        batch.quantity -= deductFromBatch;
        remainingToDeduct -= deductFromBatch;

        deductedBatches.push({
          batchNumber: batch.batchNumber,
          deducted: deductFromBatch,
          remaining: batch.quantity
        });
      }
    }

    // Update product batches and total stock
    product.inventoryBatches = sortedBatches.filter(b => b.quantity > 0);
    product.stock = product.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0);
    
    await product.save();

    return {
      success: true,
      method,
      deducted: quantity,
      remainingStock: product.stock,
      batchesUsed: deductedBatches
    };
  }

  /**
   * Add stock with batch information
   * @param {String} productId - Product ID
   * @param {Object} batchData - Batch information
   */
  static async addStock(productId, batchData) {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    const newBatch = {
      batchNumber: batchData.batchNumber || `BATCH-${Date.now()}`,
      quantity: batchData.quantity,
      purchaseDate: batchData.purchaseDate || new Date(),
      expiryDate: batchData.expiryDate,
      costPrice: batchData.costPrice,
      supplier: batchData.supplier,
      addedAt: new Date()
    };

    if (!product.inventoryBatches) {
      product.inventoryBatches = [];
    }

    product.inventoryBatches.push(newBatch);
    product.stock = product.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0);
    product.lastRestocked = new Date();

    await product.save();

    return {
      success: true,
      batch: newBatch,
      totalStock: product.stock
    };
  }

  /**
   * Check for expired inventory
   * @param {String} productId - Product ID (optional)
   */
  static async checkExpiredInventory(productId = null) {
    const query = productId ? { _id: productId } : {};
    const products = await Product.find(query);
    
    const expiredItems = [];
    const today = new Date();

    for (const product of products) {
      if (product.inventoryBatches && product.inventoryBatches.length > 0) {
        const expiredBatches = product.inventoryBatches.filter(batch => 
          batch.expiryDate && new Date(batch.expiryDate) < today && batch.quantity > 0
        );

        if (expiredBatches.length > 0) {
          expiredItems.push({
            productId: product._id,
            productName: product.name,
            expiredBatches: expiredBatches.map(b => ({
              batchNumber: b.batchNumber,
              quantity: b.quantity,
              expiryDate: b.expiryDate
            }))
          });
        }
      }
    }

    return expiredItems;
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts() {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      stock: { $gt: 0 }
    }).select('name stock lowStockThreshold category');

    return products;
  }

  /**
   * Get inventory valuation (FIFO cost method)
   */
  static async getInventoryValuation(productId = null) {
    const query = productId ? { _id: productId } : {};
    const products = await Product.find(query);
    
    let totalValue = 0;
    const valuationDetails = [];

    for (const product of products) {
      if (product.inventoryBatches && product.inventoryBatches.length > 0) {
        const productValue = product.inventoryBatches.reduce((sum, batch) => {
          return sum + (batch.quantity * (batch.costPrice || product.price));
        }, 0);

        totalValue += productValue;
        valuationDetails.push({
          productId: product._id,
          productName: product.name,
          totalQuantity: product.stock,
          value: productValue,
          batches: product.inventoryBatches.length
        });
      }
    }

    return {
      totalValue,
      products: valuationDetails
    };
  }
}

module.exports = InventoryManager;
