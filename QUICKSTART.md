# ⚡ Quick Start Guide

Get BuyIndiaX running in 5 minutes!

## 🎯 Choose Your Path

### Path 1: Local Development (Fastest)
```bash
# 1. Clone repository
git clone https://github.com/Sumant3086/BuyIndiaX.git
cd BuyIndiaX

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI

# 4. Start MongoDB (if not running)
# Option A: Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# Option B: Local installation
# Download from https://www.mongodb.com/try/download/community

# 5. Seed database (optional)
node scripts/seedProducts.js

# 6. Start application
npm run dev  # Backend on port 5000
cd client && npm start  # Frontend on port 3000
```

**Access:** http://localhost:3000

---

### Path 2: Docker (Recommended)
```bash
# 1. Clone repository
git clone https://github.com/Sumant3086/BuyIndiaX.git
cd BuyIndiaX

# 2. Setup environment
cp .env.example .env

# 3. Start with Docker Compose
docker-compose up -d

# 4. Check logs
docker-compose logs -f
```

**Access:** http://localhost:5000

---

### Path 3: Kubernetes (Production)
```bash
# 1. Clone repository
git clone https://github.com/Sumant3086/BuyIndiaX.git
cd BuyIndiaX

# 2. Update secrets
nano k8s/secrets.yaml

# 3. Deploy
cd k8s
chmod +x deploy.sh
./deploy.sh

# 4. Get service URL
kubectl get svc buyindiax-service -n buyindiax
```

See [KUBERNETES_SETUP.md](KUBERNETES_SETUP.md) for details.

---

## 🔑 Default Credentials

### Admin Account
- Email: `admin@buyindiax.com`
- Password: `admin123`

### Test Payment (Razorpay)
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

### Grafana (Monitoring)
- Username: `admin`
- Password: `admin123`

---

## 🧪 Test the Application

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Get Products
```bash
curl http://localhost:5000/api/products
```

---

## 📊 Access Monitoring

### Prometheus
```bash
# Port forward
kubectl port-forward svc/prometheus 9090:9090 -n buyindiax

# Access: http://localhost:9090
```

### Grafana
```bash
# Port forward
kubectl port-forward svc/grafana 3000:3000 -n buyindiax

# Access: http://localhost:3000
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check MongoDB is running
docker ps | grep mongo

# Or check local MongoDB
mongosh
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm start
```

### Docker Issues
```bash
# Restart Docker
docker-compose down
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 🎉 Next Steps

1. ✅ Explore the application
2. ✅ Check admin dashboard
3. ✅ Test payment flow
4. ✅ View monitoring dashboards
5. ✅ Read full documentation

---

## 📚 Documentation

- [Full README](README.md)
- [Kubernetes Setup](KUBERNETES_SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](docs/API.md)

---

Made with ❤️ by Sumant
