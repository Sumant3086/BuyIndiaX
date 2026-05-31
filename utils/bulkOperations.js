const Product = require('../models/Product');
const csv = require('csv-parser');
const { createObjectCsvStringifier } = require('csv-writer');
const fs = require('fs');

class BulkOperations {
  // CSV Import Products
  static async importProductsFromCSV(filePath) {
    const products = [];
    const errors = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            products.push({
              name: row.name,
              description: row.description,
              price: parseFloat(row.price),
              category: row.category,
              brand: row.brand || 'Generic',
              stock: parseInt(row.stock) || 0,
              image: row.image || 'https://via.placeholder.com/300'
            });
          } catch (error) {
            errors.push({ row, error: error.message });
          }
        })
        .on('end', async () => {
          try {
            const inserted = await Product.insertMany(products, { ordered: false });
            resolve({ success: inserted.length, errors: errors.length, details: errors });
          } catch (error) {
            reject(error);
          }
        });
    });
  }

  // CSV Export Products
  static async exportProductsToCSV() {
    const products = await Product.find().lean();
    
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'description', title: 'Description' },
        { id: 'price', title: 'Price' },
        { id: 'category', title: 'Category' },
        { id: 'brand', title: 'Brand' },
        { id: 'stock', title: 'Stock' },
        { id: 'rating', title: 'Rating' }
      ]
    });

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(products);
  }

  // Bulk Price Update
  static async bulkPriceUpdate(updates) {
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.productId },
        update: { 
          $set: { 
            price: update.newPrice,
            originalPrice: update.originalPrice || update.newPrice
          }
        }
      }
    }));

    return await Product.bulkWrite(bulkOps);
  }

  // Bulk Stock Adjustment
  static async bulkStockAdjustment(adjustments) {
    const bulkOps = adjustments.map(adj => ({
      updateOne: {
        filter: { _id: adj.productId },
        update: { $inc: { stock: adj.quantity } }
      }
    }));

    return await Product.bulkWrite(bulkOps);
  }

  // Bulk Discount Application
  static async applyBulkDiscount(productIds, discountPercentage) {
    return await Product.updateMany(
      { _id: { $in: productIds } },
      { 
        $set: { discount: discountPercentage },
        $mul: { price: (100 - discountPercentage) / 100 }
      }
    );
  }
}

module.exports = BulkOperations;
