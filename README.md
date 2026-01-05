# 🛍️ BuyIndiaX - Modern E-Commerce Platform

A comprehensive full-stack MERN (MongoDB, Express.js, React, Node.js) e-commerce platform featuring advanced user management, secure payment integration, and enterprise-grade DevOps automation. Built with modern web technologies and production-ready infrastructure.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Render](https://img.shields.io/badge/Deploy-Render-purple)
![AWS](https://img.shields.io/badge/AWS-EC2-orange)
![License](https://img.shields.io/badge/License-ISC-blue)

> **🚀 Live Demo**: [BuyIndiaX on Render](https://buyindiax.onrender.com) (Coming Soon)

## 🌟 Features

### 🛒 **Core E-Commerce Features**
- **User Authentication** - Secure JWT-based registration and login system
- **Product Catalog** - Browse products by categories (Electronics, Clothing, Books, Home, Sports)
- **Advanced Search** - Filter products with rating, price, and category filters
- **Shopping Cart** - Add, remove, and manage cart items with real-time updates
- **Wishlist Management** - Save favorite products for later purchase
- **Order Management** - Complete order lifecycle from placement to delivery
- **Payment Integration** - Secure payments via Razorpay gateway
- **Product Reviews** - Customer rating and review system
- **User Profiles** - Manage personal information, addresses, and order history
- **Loyalty System** - Points-based rewards with membership tiers (Bronze, Silver, Gold, Platinum)

### 👨‍💼 **Admin Dashboard**
- **Order Management** - View, track, and update order statuses
- **Business Analytics** - Real-time revenue and sales statistics
- **User Management** - Monitor customer activity and membership tiers
- **Product Analytics** - Track product views, ratings, and inventory
- **Dashboard Metrics** - Comprehensive business intelligence
- **Role-based Access** - Secure admin-only functionality

### 🚀 **DevOps & Infrastructure**
- **Infrastructure as Code** - Complete Terraform AWS deployment
- **Configuration Management** - Automated Puppet provisioning
- **System Monitoring** - Nagios-based health monitoring
- **Cloud Deployment** - AWS EC2 with auto-scaling capabilities
- **Service Management** - Systemd service configuration
- **Automated Deployment** - One-click deployment scripts

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express API    │────│   MongoDB       │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Admin Dashboard │
                    │  Role-based Auth │
                    └─────────────────┘
```

## 🛠️ Technology Stack

### **Frontend**
- **React 19.2.0** - Modern UI library with latest features
- **React Router DOM 7.9.5** - Client-side routing and navigation
- **Axios 1.13.2** - HTTP client for API communication
- **CSS3** - Custom responsive styling
- **React Testing Library** - Component testing framework

### **Backend**
- **Node.js 18.x** - JavaScript runtime environment
- **Express.js 4.18.2** - Fast, minimalist web framework
- **MongoDB Atlas** - Cloud-hosted NoSQL database
- **Mongoose 7.6.3** - MongoDB object modeling
- **JWT (jsonwebtoken 9.0.2)** - Secure authentication tokens
- **bcryptjs 2.4.3** - Password hashing and security
- **Express Validator 7.0.1** - Input validation middleware
- **Razorpay 2.9.2** - Payment gateway integration

### **DevOps & Infrastructure**
- **Terraform** - Infrastructure as Code for AWS
- **AWS EC2** - Scalable cloud computing
- **Puppet** - Configuration management and automation
- **Nagios** - System and service monitoring
- **Systemd** - Linux service management
- **Git** - Version control and collaboration

## 🚀 Quick Start Guide

### **Prerequisites**
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **MongoDB** Atlas account or local MongoDB installation
- **Git** for version control
- **Razorpay** account for payment processing (optional for development)

### **Installation & Setup**

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/BuyIndiaX.git
cd BuyIndiaX
```

2. **Install Backend Dependencies**
```bash
npm install
```

3. **Install Frontend Dependencies**
```bash
cd client
npm install
cd ..
```

4. **Environment Configuration**
```bash
# Your .env file is already configured with development settings
# No additional setup needed for local development
```
 

**⚠️ Security Note**: The `.env` file is already in `.gitignore` and won't be committed to Git.

5. **Database Setup**
```bash
# Seed the database with sample products
npm run seed
```

6. **Start Development Servers**
```bash
# Option 1: Start both frontend and backend together
npm run dev:full

# Option 2: Start separately (use two terminals)
npm run dev        # Backend server (port 5000)
npm run client     # Frontend server (port 3000)
```

7. **Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

### **First Steps**
1. Register a new user account at http://localhost:3000
2. Browse the product catalog
3. Add items to cart and test the shopping flow
4. Create an admin user (see Admin Access section) to access dashboard features

## 🔐 Admin Access & Security

### **Admin System Overview**
BuyIndiaX implements a secure, role-based admin system with the following characteristics:

### **Admin Account Creation**
- **No Registration Route**: Admin accounts cannot be created through the standard registration endpoint
- **Database-level Creation**: Admin users must be created directly in the database
- **Role Protection**: The registration API explicitly prevents `role: 'admin'` assignments

### **Admin Capabilities**
- **Order Management**: View all customer orders with pagination and filtering
- **Status Updates**: Update order status through the complete lifecycle:
  - `Pending` → `Processing` → `Shipped` → `Delivered`
- **Business Analytics**: Access comprehensive dashboard metrics including:
  - Total revenue and order statistics
  - User registration and activity metrics
  - Product performance analytics
  - Real-time business intelligence

### **Security Features**
- **JWT Authentication**: Secure token-based authentication system
- **Role-based Authorization**: Middleware protection for admin-only routes
- **Password Hashing**: bcryptjs with salt rounds for secure password storage
- **Input Validation**: Express-validator for request sanitization
- **CORS Protection**: Configured cross-origin resource sharing

### **Creating an Admin User**
To create an admin user, connect to your MongoDB database and insert a user document:

```javascript
// Connect to MongoDB and run this in MongoDB shell or script
db.users.insertOne({
  name: "Admin User",
  email: "admin@buyindiax.com",
  password: "$2a$10$hashedPasswordHere", // Use bcrypt to hash the password
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 📁 Project Structure

```
BuyIndiaX/
├── client/                    # React frontend application
│   ├── public/               # Static assets and HTML template
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components and routes
│   │   ├── context/         # React context providers
│   │   ├── App.js           # Main application component
│   │   └── index.js         # React DOM entry point
│   └── package.json         # Frontend dependencies
├── models/                   # MongoDB data models
│   ├── User.js              # User schema with roles & loyalty
│   ├── Product.js           # Product schema with categories
│   ├── Order.js             # Order management schema
│   ├── Cart.js              # Shopping cart schema
│   ├── Review.js            # Product review schema
│   └── Wishlist.js          # User wishlist schema
├── routes/                   # Express API route handlers
│   ├── auth.js              # Authentication endpoints
│   ├── products.js          # Product CRUD operations
│   ├── orders.js            # Order management
│   ├── cart.js              # Cart operations
│   ├── payment.js           # Razorpay integration
│   ├── payment-link.js      # Payment link generation
│   ├── reviews.js           # Review system
│   └── wishlist.js          # Wishlist management
├── middleware/               # Custom Express middleware
│   └── auth.js              # JWT authentication middleware
├── scripts/                  # Utility scripts
│   └── seedProducts.js      # Database seeding script
├── terraform/                # Infrastructure as Code
│   ├── buyindiax.tf         # AWS infrastructure definition
│   └── scripts/             # Deployment automation
├── puppet/                   # Configuration management
│   ├── buyindiax_deploy.pp  # Application deployment manifest
│   ├── manifests/           # Puppet configuration files
│   └── templates/           # Configuration templates
├── nagios/                   # Monitoring configuration
│   ├── buyindiax_monitoring.cfg  # Service monitoring
│   └── configs/             # Additional monitoring configs
├── server.js                 # Express server entry point
├── deploy.sh                 # Deployment automation script
├── .env.example             # Environment variables template
└── package.json             # Backend dependencies
```

## 🌐 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration (role: user only)
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user profile

### **Products**
- `GET /api/products` - Get all products with filtering
- `GET /api/products/:id` - Get single product details

### **Cart Management**
- `GET /api/cart` - Get user's cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart

### **Orders**
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's order history
- `GET /api/orders/:id` - Get single order details

### **Payment**
- `POST /api/payment` - Process payment via Razorpay
- `POST /api/payment-link` - Generate payment links

### **Reviews**
- `GET /api/reviews/:productId` - Get product reviews
- `POST /api/reviews` - Add product review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### **Wishlist**
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add item to wishlist
- `DELETE /api/wishlist/:id` - Remove from wishlist

### **Admin Endpoints (Protected)**
- `GET /api/orders/admin/dashboard` - Dashboard analytics
- `GET /api/orders/admin/all` - All orders with pagination
- `PUT /api/orders/admin/:id/status` - Update order status

## 🚀 Deployment

### **Render Deployment (Recommended)**

BuyIndiaX is optimized for deployment on Render with a single web service configuration.

#### **Quick Deployment Steps**

1. **Fork/Clone Repository**
   - Fork this repository to your GitHub account
   - Your `.env` file is already configured for development

2. **Deploy to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Name**: `buyindiax` (or your preferred name)
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node
     - **Plan**: Free (for testing) or Starter+ (for production)

3. **Set Environment Variables in Render Dashboard**
   
   **⚠️ IMPORTANT**: Set these in Render Dashboard, not in code:
   ```bash
   NODE_ENV=production
   PORT=5000
   CORS_ORIGIN=https://your-app-name.onrender.com
   MONGODB_URI=mongodb+srv://sumant:sumant123@db.bhuvr7p.mongodb.net/?appName=DB
   JWT_SECRET=buyindiax_secret_key_2024_secure_token
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_PAYMENT_LINK=https://razorpay.me/@sumantyadav
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your app will be available at `https://your-app-name.onrender.com`

#### **Post-Deployment Setup**
- Test the application at your Render URL
- Create admin user directly in MongoDB Atlas
- Update Razorpay keys when you get real credentials

#### **⚠️ Security Recommendations**
- **Change MongoDB password** before production deployment
- **Generate stronger JWT secret** for production
- **Get real Razorpay credentials** from your dashboard
- **Never commit .env files** to GitHub (already in .gitignore)

### **AWS Deployment with Terraform**

1. **Prerequisites**
- AWS CLI configured
- Terraform installed
- SSH key pair created

2. **Deploy infrastructure**
```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
```

3. **Configure application**
```bash
# SSH into the instance
ssh -i ~/.ssh/your-key.pem ubuntu@<instance-ip>

# Apply Puppet configuration
sudo puppet apply /home/ubuntu/app/puppet/buyindiax_deploy.pp
```

### **Manual Deployment**

1. **Server setup**
```bash
# Install Node.js, MongoDB, and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb git
```

2. **Application deployment**
```bash
# Clone and setup
git clone https://github.com/Sumant3086/BuyIndiaX.git
cd BuyIndiaX
npm install
cd client && npm install && cd ..

# Environment setup
cp .env.example .env
# Update .env with production values

# Build frontend
npm run build

# Seed database
npm run seed

# Start services
npm start
```

## 📊 Monitoring

The application includes Nagios monitoring for:
- **HTTP Services** - Frontend (port 3000) and Backend (port 5000)
- **Database** - MongoDB connection (port 27017)
- **System Resources** - CPU, memory, disk usage
- **SSH Access** - Remote connectivity

Access Nagios dashboard at: `http://your-server/nagios4`

## 🔧 Available Scripts

### **Development Scripts**
```bash
npm run dev          # Start backend with nodemon (auto-reload)
npm run client       # Start React development server (port 3000)
npm run dev:full     # Start both frontend and backend concurrently
```

### **Database Scripts**
```bash
npm run seed         # Populate database with sample products
```

### **Production Scripts**
```bash
npm start            # Start backend server in production mode
npm run build        # Build React application for production (in client/)
```

### **Client-specific Scripts** (run from `/client` directory)
```bash
npm start            # Start React development server
npm run build        # Create production build
npm test             # Run React test suite
npm run eject        # Eject from Create React App (irreversible)
```

## 👨‍💻 Author & Contact

**Developer**: Sumant Yadav  
**GitHub**: [@Sumant3086](https://github.com/Sumant3086)  
**Email**: sumantyadav3086@gmail.com  

## 🤝 Contributing

We welcome contributions to BuyIndiaX! Here's how you can help:

### **Getting Started**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests as needed
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### **Contribution Guidelines**
- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Update documentation for any new features
- Ensure all tests pass before submitting
- Add tests for new functionality

### **Areas for Contribution**
- Frontend UI/UX improvements
- Additional payment gateway integrations
- Enhanced admin dashboard features
- Mobile app development
- Performance optimizations
- Security enhancements

## � TLicense

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MERN Stack Community** - For excellent documentation and resources
- **MongoDB Atlas** - Cloud database hosting
- **Razorpay** - Payment gateway integration
- **AWS** - Cloud infrastructure services
- **Open Source Contributors** - For the amazing tools and libraries used

---

**⭐ If you found this project helpful, please consider giving it a star on GitHub!**

**🐛 Found a bug or have a feature request? [Open an issue](https://github.com/Sumant3086/BuyIndiaX/issues)**
