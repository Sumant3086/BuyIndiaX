const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample products data
const sampleProducts = [
  {
    name: "iPhone 15 Pro",
    description: "Latest iPhone with advanced camera system and A17 Pro chip",
    price: 999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500",
    stock: 50,
    rating: 4.8
  },
  {
    name: "Samsung Galaxy S24",
    description: "Flagship Android phone with AI features and excellent display",
    price: 899,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
    stock: 45,
    rating: 4.7
  },
  {
    name: "MacBook Air M3",
    description: "Ultra-thin laptop with M3 chip and all-day battery life",
    price: 1299,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
    stock: 30,
    rating: 4.9
  },
  {
    name: "Sony WH-1000XM5",
    description: "Premium noise-canceling wireless headphones",
    price: 399,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    stock: 75,
    rating: 4.6
  },
  {
    name: "Nike Air Max 270",
    description: "Comfortable running shoes with Max Air cushioning",
    price: 150,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    stock: 100,
    rating: 4.5
  },
  {
    name: "Levi's 501 Jeans",
    description: "Classic straight-fit jeans in premium denim",
    price: 89,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    stock: 80,
    rating: 4.4
  },
  {
    name: "The Great Gatsby",
    description: "Classic American novel by F. Scott Fitzgerald",
    price: 12,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
    stock: 200,
    rating: 4.3
  },
  {
    name: "JavaScript: The Good Parts",
    description: "Essential guide to JavaScript programming",
    price: 25,
    category: "Books",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500",
    stock: 150,
    rating: 4.7
  },
  {
    name: "Smart Home Hub",
    description: "Control all your smart devices from one central hub",
    price: 199,
    category: "Home",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
    stock: 60,
    rating: 4.2
  },
  {
    name: "Yoga Mat Premium",
    description: "Non-slip yoga mat for comfortable practice",
    price: 45,
    category: "Sports",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500",
    stock: 120,
    rating: 4.6
  },
  {
    name: "Wireless Earbuds Pro",
    description: "True wireless earbuds with active noise cancellation",
    price: 249,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
    stock: 90,
    rating: 4.5
  },
  {
    name: "Cotton T-Shirt",
    description: "Comfortable 100% cotton t-shirt in various colors",
    price: 25,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    stock: 200,
    rating: 4.3
  },
  {
    name: "Coffee Table Book",
    description: "Beautiful photography book for your living room",
    price: 35,
    category: "Books",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
    stock: 75,
    rating: 4.4
  },
  {
    name: "LED Desk Lamp",
    description: "Adjustable LED desk lamp with USB charging port",
    price: 79,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
    stock: 85,
    rating: 4.5
  },
  {
    name: "Basketball",
    description: "Official size basketball for indoor and outdoor play",
    price: 29,
    category: "Sports",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500",
    stock: 150,
    rating: 4.4
  }
];

// Function to create users
const createUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    const users = [];

    // Create 20 regular users
    for (let i = 1; i <= 20; i++) {
      const hashedPassword = await bcrypt.hash(`user${i}123`, 10);
      users.push({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        role: 'user',
        loyaltyPoints: Math.floor(Math.random() * 1000),
        membershipTier: ['Bronze', 'Silver', 'Gold'][Math.floor(Math.random() * 3)]
      });
    }

    // Create admin user from environment variables
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const hashedAdminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      users.push({
        name: process.env.ADMIN_NAME || 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: hashedAdminPassword,
        role: 'admin',
        loyaltyPoints: 0,
        membershipTier: 'Platinum'
      });
    }

    // Insert all users
    await User.insertMany(users);
    console.log(`✅ Created ${users.length} users (20 regular + 1 admin)`);
    
    // Log admin credentials for reference
    console.log('\n🔐 Admin Account Created:');
    console.log(`Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD}`);
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating users:', error);
  }
};

// Function to create products
const createProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${sampleProducts.length} products`);

  } catch (error) {
    console.error('Error creating products:', error);
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await createUsers();
    await createProducts();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 20 regular users created (user1@example.com to user20@example.com)');
    console.log('- 1 admin user created from .env credentials');
    console.log('- 15 sample products created across all categories');
    console.log('\n🔑 Login Credentials:');
    console.log('Regular Users: user1@example.com / user1123, user2@example.com / user2123, etc.');
    console.log(`Admin: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
    
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n📝 Database connection closed');
  }
};

// Run the seeding
seedDatabase();