const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function listProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const products = await Product.find().select('name image').sort('name');
    
    console.log(`Total products: ${products.length}\n`);
    
    products.forEach((p, i) => {
      const hasImage = p.image && p.image.length > 20;
      console.log(`${i+1}. ${p.name} ${hasImage ? '✅' : '❌'}`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listProducts();
