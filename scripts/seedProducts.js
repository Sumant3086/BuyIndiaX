const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const products = [
  // Electronics
  {
    name: 'Apple iPhone 15 Pro Max (256GB)',
    description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system. Features ProMotion display and Action button.',
    price: 159900,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
    stock: 25,
    rating: 4.8,
    numReviews: 342
  },
  {
    name: 'Samsung Galaxy S24 Ultra (512GB)',
    description: 'Premium Android flagship with S Pen, 200MP camera, and AI features. Snapdragon 8 Gen 3 processor.',
    price: 129999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
    stock: 30,
    rating: 4.7,
    numReviews: 289
  },
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Industry-leading noise cancellation, exceptional sound quality, 30-hour battery life. Premium comfort.',
    price: 29990,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
    stock: 50,
    rating: 4.9,
    numReviews: 567
  },
  {
    name: 'Apple MacBook Air M3 (13-inch, 16GB)',
    description: 'Powerful M3 chip, stunning Liquid Retina display, all-day battery life. Perfect for professionals.',
    price: 134900,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
    stock: 15,
    rating: 4.9,
    numReviews: 423
  },
  {
    name: 'Dell XPS 15 (Intel i7, 32GB RAM, 1TB SSD)',
    description: 'Premium Windows laptop with InfinityEdge display, powerful performance for creators.',
    price: 189990,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500',
    stock: 12,
    rating: 4.6,
    numReviews: 198
  },
  {
    name: 'iPad Pro 12.9" M2 (256GB, Wi-Fi)',
    description: 'Ultimate iPad experience with M2 chip, Liquid Retina XDR display, and Apple Pencil support.',
    price: 112900,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
    stock: 20,
    rating: 4.8,
    numReviews: 312
  },
  {
    name: 'Samsung 55" QLED 4K Smart TV',
    description: 'Quantum Dot technology, 4K resolution, smart features with Tizen OS. HDR10+ support.',
    price: 64990,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500',
    stock: 18,
    rating: 4.5,
    numReviews: 234
  },
  {
    name: 'Canon EOS R6 Mark II (Body Only)',
    description: 'Professional mirrorless camera with 24.2MP sensor, 40fps burst, 6K video recording.',
    price: 239990,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1606980707986-8f6e1f0d1e0f?w=500',
    stock: 8,
    rating: 4.9,
    numReviews: 156
  },
  {
    name: 'Apple Watch Series 9 (45mm GPS)',
    description: 'Advanced health features, always-on Retina display, crash detection, and ECG app.',
    price: 45900,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500',
    stock: 35,
    rating: 4.7,
    numReviews: 445
  },
  {
    name: 'JBL Flip 6 Portable Bluetooth Speaker',
    description: 'Waterproof portable speaker with powerful sound, 12-hour battery, PartyBoost feature.',
    price: 9999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
    stock: 60,
    rating: 4.6,
    numReviews: 678
  },

  // Clothing
  {
    name: 'Levi\'s 511 Slim Fit Jeans',
    description: 'Classic slim fit jeans with stretch comfort. Premium denim quality, versatile style.',
    price: 3499,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
    stock: 100,
    rating: 4.5,
    numReviews: 892
  },
  {
    name: 'Nike Air Max 270 Running Shoes',
    description: 'Iconic Air Max cushioning, breathable mesh upper, perfect for running and casual wear.',
    price: 12995,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    stock: 75,
    rating: 4.7,
    numReviews: 1023
  },
  {
    name: 'Adidas Originals Trefoil Hoodie',
    description: 'Classic hoodie with iconic trefoil logo, soft cotton blend, comfortable fit.',
    price: 4299,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
    stock: 85,
    rating: 4.6,
    numReviews: 567
  },
  {
    name: 'Zara Formal Blazer (Men)',
    description: 'Tailored fit blazer, premium fabric, perfect for office and formal occasions.',
    price: 5999,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500',
    stock: 40,
    rating: 4.4,
    numReviews: 234
  },
  {
    name: 'H&M Cotton T-Shirt Pack (3 Pack)',
    description: 'Comfortable cotton t-shirts, regular fit, available in multiple colors.',
    price: 1499,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    stock: 150,
    rating: 4.3,
    numReviews: 1245
  },
  {
    name: 'Puma Sports Track Pants',
    description: 'Comfortable track pants with moisture-wicking fabric, perfect for workouts.',
    price: 2499,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500',
    stock: 90,
    rating: 4.5,
    numReviews: 456
  },
  {
    name: 'Ray-Ban Aviator Classic Sunglasses',
    description: 'Iconic aviator design, UV protection, durable metal frame with crystal lenses.',
    price: 8990,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500',
    stock: 55,
    rating: 4.8,
    numReviews: 789
  },
  {
    name: 'Fossil Leather Wallet (Men)',
    description: 'Genuine leather bifold wallet, multiple card slots, RFID protection.',
    price: 2999,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
    stock: 70,
    rating: 4.6,
    numReviews: 345
  },

  // Books
  {
    name: 'Atomic Habits by James Clear',
    description: 'Bestselling book on building good habits and breaking bad ones. Life-changing insights.',
    price: 599,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
    stock: 200,
    rating: 4.9,
    numReviews: 2345
  },
  {
    name: 'The Psychology of Money by Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness. Essential financial wisdom.',
    price: 450,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500',
    stock: 180,
    rating: 4.8,
    numReviews: 1876
  },
  {
    name: 'Ikigai: The Japanese Secret to a Long and Happy Life',
    description: 'Discover your reason for being. Inspiring guide to finding purpose and joy.',
    price: 399,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
    stock: 150,
    rating: 4.7,
    numReviews: 1234
  },
  {
    name: 'Rich Dad Poor Dad by Robert Kiyosaki',
    description: 'Classic personal finance book. Learn what the rich teach their kids about money.',
    price: 350,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500',
    stock: 220,
    rating: 4.6,
    numReviews: 3456
  },
  {
    name: 'Think and Grow Rich by Napoleon Hill',
    description: 'Timeless classic on success principles. Transform your mindset for wealth.',
    price: 299,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500',
    stock: 190,
    rating: 4.7,
    numReviews: 2890
  },

  // Home & Kitchen
  {
    name: 'Philips Air Fryer XXL (7.3L)',
    description: 'Large capacity air fryer with Rapid Air technology. Healthy cooking with 90% less fat.',
    price: 18995,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500',
    stock: 35,
    rating: 4.6,
    numReviews: 567
  },
  {
    name: 'Dyson V15 Detect Cordless Vacuum',
    description: 'Powerful cordless vacuum with laser detection, HEPA filtration, 60-minute runtime.',
    price: 58900,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500',
    stock: 20,
    rating: 4.8,
    numReviews: 234
  },
  {
    name: 'Prestige Induction Cooktop (2000W)',
    description: 'Energy-efficient induction cooktop with preset menus, auto shut-off, timer function.',
    price: 3499,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500',
    stock: 45,
    rating: 4.4,
    numReviews: 789
  },
  {
    name: 'Amazon Echo Dot (5th Gen) Smart Speaker',
    description: 'Alexa-enabled smart speaker with improved sound, smart home control, voice assistant.',
    price: 4999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500',
    stock: 80,
    rating: 4.5,
    numReviews: 1234
  },
  {
    name: 'IKEA POÄNG Armchair with Cushion',
    description: 'Comfortable armchair with layer-glued bent birch frame, washable cover.',
    price: 12990,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
    stock: 25,
    rating: 4.7,
    numReviews: 456
  },
  {
    name: 'Cello Opalware Dinner Set (27 Pieces)',
    description: 'Microwave safe dinner set, break-resistant opalware, elegant design for 6 people.',
    price: 2999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500',
    stock: 60,
    rating: 4.3,
    numReviews: 678
  },

  // Sports & Fitness
  {
    name: 'Decathlon Domyos Yoga Mat (8mm)',
    description: 'Non-slip yoga mat with excellent cushioning, eco-friendly material, includes carry strap.',
    price: 1299,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
    stock: 100,
    rating: 4.5,
    numReviews: 890
  },
  {
    name: 'Fitbit Charge 6 Fitness Tracker',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, sleep tracking, 7-day battery.',
    price: 14999,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500',
    stock: 45,
    rating: 4.6,
    numReviews: 567
  },
  {
    name: 'Cosco Cricket Bat (English Willow)',
    description: 'Professional cricket bat, Grade 1 English willow, perfect balance and pickup.',
    price: 8999,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
    stock: 30,
    rating: 4.7,
    numReviews: 234
  },
  {
    name: 'Nivia Storm Football (Size 5)',
    description: 'Professional match football, hand-stitched, excellent durability and flight.',
    price: 1299,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=500',
    stock: 75,
    rating: 4.4,
    numReviews: 456
  },
  {
    name: 'Yonex Badminton Racket (Nanoray Series)',
    description: 'Lightweight badminton racket with isometric head shape, excellent control and power.',
    price: 4999,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
    stock: 50,
    rating: 4.6,
    numReviews: 345
  },

  // Other
  {
    name: 'Lego Creator Expert Taj Mahal (5923 Pieces)',
    description: 'Iconic building set, detailed replica of Taj Mahal, perfect for display and collectors.',
    price: 29999,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500',
    stock: 15,
    rating: 4.9,
    numReviews: 123
  },
  {
    name: 'Casio G-Shock Digital Watch',
    description: 'Shock-resistant watch, 200m water resistance, world time, stopwatch, LED light.',
    price: 7995,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    stock: 65,
    rating: 4.7,
    numReviews: 890
  },
  {
    name: 'Parker Jotter Ballpoint Pen (Premium)',
    description: 'Classic stainless steel pen, smooth writing, refillable, elegant design.',
    price: 899,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&q=80',
    stock: 200,
    rating: 4.5,
    numReviews: 456
  },
  {
    name: 'Moleskine Classic Notebook (Large, Ruled)',
    description: 'Premium quality notebook, acid-free paper, elastic closure, expandable pocket.',
    price: 1499,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500',
    stock: 120,
    rating: 4.8,
    numReviews: 678
  },
  {
    name: 'Fujifilm Instax Mini 11 Instant Camera',
    description: 'Fun instant camera with automatic exposure, selfie mode, includes film pack.',
    price: 5999,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
    stock: 40,
    rating: 4.6,
    numReviews: 567
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    await Product.deleteMany({});
    console.log('Existing products deleted...');

    await Product.insertMany(products);
    console.log(`${products.length} products seeded successfully!`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
