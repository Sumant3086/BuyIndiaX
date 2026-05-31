const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

const testConnection = async () => {
  try {
    console.log('\n1. Attempting to connect to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    
    console.log('✓ MongoDB connected successfully!');
    console.log('✓ Connection state:', mongoose.connection.readyState);
    console.log('✓ Database name:', mongoose.connection.name);
    console.log('✓ Host:', mongoose.connection.host);
    
    // Test a simple query
    console.log('\n2. Testing database query...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✓ Collections found:', collections.length);
    collections.forEach(col => console.log('  -', col.name));
    
    console.log('\n✓ All tests passed! MongoDB connection is working.');
    
  } catch (err) {
    console.error('\n✗ MongoDB connection failed!');
    console.error('Error:', err.message);
    
    if (err.message.includes('Server selection timed out')) {
      console.error('\nPossible causes:');
      console.error('1. IP address not whitelisted in MongoDB Atlas');
      console.error('   → Go to MongoDB Atlas → Network Access → Add IP Address');
      console.error('   → Add your current IP or use 0.0.0.0/0 for testing');
      console.error('2. Firewall blocking connection on port 27017');
      console.error('3. VPN or proxy interfering with connection');
    } else if (err.message.includes('Authentication failed')) {
      console.error('\nAuthentication issue:');
      console.error('→ Check username and password in .env file');
      console.error('→ Verify user has correct permissions in MongoDB Atlas');
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed.');
    process.exit(0);
  }
};

testConnection();
