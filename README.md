# BuyIndiaX - E-commerce Platform

A modern, full-stack e-commerce platform built with MongoDB, Express, React, and Node.js. Shop the best products from India with a seamless shopping experience.

## Features

- User authentication and authorization
- Product catalog with search and filtering
- Shopping cart functionality
- Secure payment processing with Razorpay
- Order management
- Responsive design

## Setup Instructions

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example` and add your credentials:
   - MongoDB Atlas connection string
   - JWT secret key
   - Razorpay API keys

3. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the React app:
```bash
npm start
```

### Run Full Stack

From root directory:
```bash
npm run dev:full
```

## API Endpoints

### Auth
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get single product
- POST `/api/products` - Create product (Admin)

### Cart
- GET `/api/cart` - Get user cart
- POST `/api/cart` - Add to cart
- PUT `/api/cart/:id` - Update cart item
- DELETE `/api/cart/:id` - Remove from cart

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders` - Get user orders
- GET `/api/orders/:id` - Get order details

### Payment
- POST `/api/payment/create-order` - Create Razorpay order
- POST `/api/payment/verify` - Verify payment
- POST `/api/payment/payment-link` - Get payment link for order
- POST `/api/payment/confirm-payment` - Confirm manual payment

## Technologies

- **Frontend**: React, React Router, Axios, Context API
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT, bcryptjs
- **Payment**: Razorpay

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Protected routes
- Input validation
- CORS configuration
