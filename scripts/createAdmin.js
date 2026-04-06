const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@buyindiax.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', adminEmail);
      
      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('User role updated to admin!');
      }
      
      // Update password if provided
      existingAdmin.password = adminPassword;
      existingAdmin.name = adminName;
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
      console.log('-----------------------------------');
      console.log('Name:', adminName);
      console.log('Email:', adminEmail);
      console.log('Password: [Updated]');
      console.log('-----------------------------------');
      
      process.exit(0);
    }

    // Create new admin user
    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Name:', adminName);
    console.log('Email:', adminEmail);
    console.log('Password: [Set from .env]');
    console.log('-----------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
