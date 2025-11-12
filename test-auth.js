const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testAuth = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Check if user exists
    const existingUser = await User.findOne({ email: 'Rahul@gmail.com' });
    
    if (existingUser) {
      console.log('✅ User already exists in MongoDB:');
      console.log('   Name:', existingUser.name);
      console.log('   Email:', existingUser.email);
      console.log('   Created:', existingUser.createdAt);
    } else {
      console.log('❌ User does not exist. Creating user...');
      
      const newUser = new User({
        name: 'Rahul',
        email: 'Rahul@gmail.com',
        password: 'rahul123'
      });
      
      await newUser.save();
      console.log('✅ User created successfully!');
      console.log('   Email: Rahul@gmail.com');
      console.log('   Password: rahul123');
    }

    // List all users
    const allUsers = await User.find({}, 'name email createdAt');
    console.log('\n📋 All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testAuth();
