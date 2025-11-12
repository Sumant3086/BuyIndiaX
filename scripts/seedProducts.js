const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config();

const products = [
  {
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 2999,
    originalPrice: 4999,
    discount: 40,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    stock: 50,
    rating: 4.5,
    numReviews: 128,
    isFeatured: true,
    tags: ['wireless', 'audio', 'noise-cancelling']
  },
  {
    name: 'Smart Watch Pro',
    description: 'Feature-packed smartwatch with fitness tracking, heart rate monitor, and 7-day battery life.',
    price: 4999,
    originalPrice: 7999,
    discount: 37,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    stock: 35,
    rating: 4.3,
    numReviews: 95,
    isFeatured: true,
    tags: ['smartwatch', 'fitness', 'wearable']
  },
  {
    name: 'Cotton Casual T-Shirt',
    description: 'Comfortable 100% cotton t-shirt available in multiple colors. Perfect for everyday wear.',
    price: 499,
    originalPrice: 799,
    discount: 38,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    stock: 100,
    rating: 4.2,
    numReviews: 210,
    tags: ['cotton', 'casual', 'comfortable']
  },
  {
    name: 'Designer Denim Jeans',
    description: 'Premium quality denim jeans with modern fit. Durable and stylish for any occasion.',
    price: 1299,
    originalPrice: 2499,
    discount: 48,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
    stock: 75,
    rating: 4.6,
    numReviews: 156,
    isFeatured: true,
    tags: ['denim', 'jeans', 'fashion']
  },
  {
    name: 'The Complete Guide to Web Development',
    description: 'Comprehensive guide covering HTML, CSS, JavaScript, and modern frameworks. Perfect for beginners and intermediates.',
    price: 799,
    originalPrice: 1299,
    discount: 38,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
    stock: 60,
    rating: 4.8,
    numReviews: 342,
    isFeatured: true,
    tags: ['programming', 'web-development', 'education']
  },
  {
    name: 'Motivational Success Stories',
    description: 'Inspiring collection of success stories from entrepreneurs and leaders around the world.',
    price: 599,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
    stock: 45,
    rating: 4.4,
    numReviews: 89,
    tags: ['motivation', 'success', 'inspiration']
  },
  {
    name: 'Modern Table Lamp',
    description: 'Elegant LED table lamp with adjustable brightness. Perfect for study and bedroom.',
    price: 1499,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
    stock: 40,
    rating: 4.3,
    numReviews: 67
  },
  {
    name: 'Decorative Wall Clock',
    description: 'Beautiful wall clock with silent movement. Adds elegance to any room.',
    price: 899,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500',
    stock: 55,
    rating: 4.1,
    numReviews: 43
  },
  {
    name: 'Professional Yoga Mat',
    description: 'Non-slip yoga mat with extra cushioning. Ideal for yoga, pilates, and fitness exercises.',
    price: 1199,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
    stock: 80,
    rating: 4.7,
    numReviews: 234
  },
  {
    name: 'Adjustable Dumbbells Set',
    description: 'Space-saving adjustable dumbbells with multiple weight options. Perfect for home workouts.',
    price: 3499,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500',
    stock: 30,
    rating: 4.5,
    numReviews: 178
  },
  {
    name: 'Wireless Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with powerful bass and 12-hour battery life. Waterproof design.',
    price: 1999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
    stock: 65,
    rating: 4.4,
    numReviews: 145
  },
  {
    name: 'Premium Coffee Maker',
    description: 'Automatic coffee maker with programmable timer. Makes perfect coffee every time.',
    price: 2799,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
    stock: 25,
    rating: 4.6,
    numReviews: 92
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    await Product.deleteMany({});
    console.log('Existing products deleted');

    await Product.insertMany(products);
    console.log('Sample products added successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
