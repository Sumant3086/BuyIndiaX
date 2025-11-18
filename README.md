# BuyIndiaX - MERN E-Commerce Platform

Full-stack e-commerce with AWS deployment using Terraform, Puppet, and Nagios.

## Quick Start (Local)

```bash
npm install
cd client && npm install && cd ..
npm start                    # Backend (port 5000)
cd client && npm start       # Frontend (port 3000)
```

## AWS Deployment

```bash
deploy.bat                   # Windows
```

## Tech Stack

- React 18, Node.js, Express, MongoDB
- AWS EC2, Terraform, Puppet, Nagios, PM2

## Environment (.env)

```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

## API Endpoints

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/products` - Products
- `POST /api/cart` - Cart
- `POST /api/orders` - Orders
- `GET /api/health` - Health check

## Deployment Guide

See `DEPLOYMENT_STEPS.txt` for complete instructions.

**After deployment:**
- App: `http://[SERVER_IP]:3000`
- Nagios: `http://[SERVER_IP]/nagios4`

**Cleanup:**
```bash
cd terraform && terraform destroy
```
