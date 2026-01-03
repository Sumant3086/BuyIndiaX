# 🛍️ BuyIndiaX - Modern E-Commerce Platform

A full-stack MERN (MongoDB, Express.js, React, Node.js) e-commerce platform with comprehensive admin dashboard and DevOps automation. Built with modern web technologies and deployed using Infrastructure as Code.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)
![AWS](https://img.shields.io/badge/AWS-EC2-orange)

## 🌟 Features

### 🛒 **E-Commerce Functionality**
- User registration and JWT authentication
- Product catalog with categories and search
- Shopping cart and wishlist management
- Order placement and tracking
- Payment integration with Razorpay
- Product reviews and ratings
- Responsive design for all devices

### 👨‍💼 **Admin Dashboard**
- Comprehensive order management
- Real-time business analytics
- User and product statistics
- Order status tracking and updates
- Revenue monitoring
- Secure admin-only access

### 🚀 **DevOps Integration**
- Infrastructure as Code with Terraform
- Automated deployment with Puppet
- Real-time monitoring with Nagios
- AWS EC2 cloud deployment
- Systemd service management

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
- **React 19.2.0** - Modern UI library with hooks
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Custom styling with responsive design

### **Backend**
- **Node.js 18.x** - JavaScript runtime
- **Express.js 4.18.2** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing

### **DevOps & Deployment**
- **Terraform** - Infrastructure as Code
- **AWS EC2** - Cloud computing platform
- **Puppet** - Configuration management
- **Nagios** - System monitoring
- **Systemd** - Service management

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18.x or higher
- MongoDB (local or Atlas)
- Git

### **Local Development**

1. **Clone the repository**
```bash
git clone https://github.com/Sumant3086/BuyIndiaX.git
cd BuyIndiaX
```

2. **Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

3. **Environment setup**
```bash
# Copy environment file
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret
```

4. **Seed the database**
```bash
npm run seed
```

5. **Start the application**
```bash
# Start both frontend and backend
npm run dev:full

# Or start separately
npm run dev        # Backend only (port 5000)
npm run client     # Frontend only (port 3000)
```

6. **Access the application**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Admin Dashboard:** http://localhost:3000/admin

## 🔐 Admin Access

The application includes a secure admin system with the following capabilities:

### **Admin Features**
- View all customer orders with pagination
- Update order status (Pending → Processing → Shipped → Delivered)
- Monitor business analytics and revenue
- Track user statistics and product performance
- Real-time dashboard with key metrics

### **Security**
- Single admin account (cannot be created through registration)
- Role-based authentication and authorization
- Protected admin routes and API endpoints
- JWT-based secure authentication

## 📁 Project Structure

```
BuyIndiaX/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── App.js         # Main app component
│   └── package.json
├── models/                # MongoDB schemas
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   └── Cart.js
├── routes/                # Express API routes
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   └── cart.js
├── middleware/            # Custom middleware
├── scripts/               # Database seeding
├── terraform/             # Infrastructure as Code
├── puppet/                # Configuration management
├── nagios/                # Monitoring configuration
├── server.js              # Express server entry point
└── package.json
```

## 🌐 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Products**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product

### **Orders**
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order

### **Admin (Protected)**
- `GET /api/orders/admin/dashboard` - Dashboard statistics
- `GET /api/orders/admin/all` - All orders with pagination
- `PUT /api/orders/admin/:id/status` - Update order status

### **Cart & Wishlist**
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist` - Add to wishlist

## 🚀 Deployment

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

```bash
# Development
npm run dev          # Start backend with nodemon
npm run client       # Start React development server
npm run dev:full     # Start both frontend and backend

# Database
npm run seed         # Seed database with sample data

# Production
npm start            # Start backend in production mode
npm run build        # Build React for production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Environment Variables

```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/buyindiax
JWT_SECRET=your_jwt_secret_key_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NODE_ENV=development
```

## 🐛 Troubleshooting

### **Common Issues**

**MongoDB Connection Error**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**Port Already in Use**
```bash
# Kill process on port 3000/5000
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5000 | xargs kill -9
```

**Permission Denied**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Sumant Yadav**
- GitHub: [@Sumant3086](https://github.com/Sumant3086)
- Email: sumant@gmail.com

## 🙏 Acknowledgments

- Built with MERN stack
- Deployed on AWS infrastructure
- Automated with DevOps best practices
- Monitored with Nagios

---

**⭐ Star this repository if you found it helpful!**
