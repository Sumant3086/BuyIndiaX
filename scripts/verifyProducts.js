const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function verifyProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const count = await Product.countDocuments();
    console.log(`✅ Total Products: ${count}\n`);

    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📊 Products by Category:');
    categories.forEach(c => {
      console.log(`   ${c._id}: ${c.count} products`);
    });

    console.log('\n🔥 Featured Products:');
    const featured = await Product.find({ isFeatured: true }).select('name category');
    featured.forEach(p => {
      console.log(`   - ${p.name} (${p.category})`);
    });

    console.log('\n⚠️  Low Stock Products:');
    const lowStock = await Product.find({ stock: { $lte: 10 } }).select('name stock').limit(5);
    lowStock.forEach(p => {
      console.log(`   - ${p.name}: ${p.stock} units`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyProducts();
