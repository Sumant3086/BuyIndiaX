# 🪟 Windows Setup Guide for BuyIndiaX

Complete step-by-step guide for Windows users.

## 🎯 Choose Your Setup Method

### Method 1: Automated Setup (Recommended) ⚡
**Easiest and fastest way!**

### Method 2: Docker Compose 🐳
**Run everything in containers**

### Method 3: Manual Setup 🔧
**Full control over installation**

---

## ⚡ Method 1: Automated Setup (RECOMMENDED)

### Step 1: Open PowerShell as Administrator
1. Press `Win + X`
2. Click "Windows PowerShell (Admin)" or "Terminal (Admin)"

### Step 2: Navigate to Project
```powershell
cd C:\Users\HP\Desktop\BuyIndiaX
```

### Step 3: Run Setup Script
```powershell
# Allow script execution (first time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run setup
.\setup-windows.ps1
```

**This script will:**
- ✅ Check if Docker and Node.js are installed
- ✅ Install all dependencies (backend + frontend)
- ✅ Create .env file
- ✅ Start MongoDB in Docker
- ✅ Optionally seed database with sample products

### Step 4: Start Application
```powershell
# Start backend
.\start-dev.ps1

# In another PowerShell window, start frontend
cd client
npm start
```

### Step 5: Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

**Done! 🎉**

---

## 🐳 Method 2: Docker Compose (EASIEST)

### Step 1: Open PowerShell
```powershell
cd C:\Users\HP\Desktop\BuyIndiaX
```

### Step 2: Run Docker Script
```powershell
.\start-docker.ps1
```

### Step 3: Access Application
- Application: http://localhost:5000

**That's it! Everything runs in Docker! 🎉**

---

## 🔧 Method 3: Manual Setup

### Prerequisites

#### 1. Install Docker Desktop
- Download: https://www.docker.com/products/docker-desktop
- Install and restart computer
- Start Docker Desktop

#### 2. Install Node.js (Already installed ✅)
- You have: v22.16.0
- Required: v18+

#### 3. Install Git (Already installed ✅)

### Setup Steps

#### Step 1: Install Dependencies
```powershell
# Backend dependencies
npm install

# Frontend dependencies
cd client
npm install
cd ..
```

#### Step 2: Setup Environment
```powershell
# Copy example env file
Copy-Item .env.example .env

# Edit .env file
notepad .env
```

**Update these values in .env:**
```env
# MongoDB (use this for Docker MongoDB)
MONGODB_URI=mongodb://admin:mongopassword123@localhost:27017/buyindiax?authSource=admin

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Razorpay (get from https://razorpay.com)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google AI (get from https://makersuite.google.com/app/apikey)
GOOGLE_API_KEY=your_google_api_key

# Email (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Step 3: Start MongoDB
```powershell
docker run -d `
  --name buyindiax-mongodb `
  -p 27017:27017 `
  -e MONGO_INITDB_ROOT_USERNAME=admin `
  -e MONGO_INITDB_ROOT_PASSWORD=mongopassword123 `
  -v buyindiax-mongodb-data:/data/db `
  mongo:6.0
```

#### Step 4: Seed Database (Optional)
```powershell
node scripts/seedProducts.js
```

#### Step 5: Start Backend
```powershell
npm run dev
```

#### Step 6: Start Frontend (New PowerShell Window)
```powershell
cd C:\Users\HP\Desktop\BuyIndiaX\client
npm start
```

#### Step 7: Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🔑 Default Credentials

### Admin Account
- Email: `admin@buyindiax.com`
- Password: `admin123`

### Test Payment (Razorpay Test Mode)
- Card: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date

---

## 📊 Useful Commands

### Docker Commands
```powershell
# Check running containers
docker ps

# View MongoDB logs
docker logs buyindiax-mongodb

# Stop MongoDB
docker stop buyindiax-mongodb

# Start MongoDB
docker start buyindiax-mongodb

# Remove MongoDB container
docker rm buyindiax-mongodb

# Remove MongoDB data
docker volume rm buyindiax-mongodb-data
```

### Application Commands
```powershell
# Start backend (development)
npm run dev

# Start backend (production)
npm start

# Start frontend
cd client
npm start

# Build frontend for production
cd client
npm run build
```

### Docker Compose Commands
```powershell
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```powershell
# Check if MongoDB is running
docker ps | Select-String "buyindiax-mongodb"

# If not running, start it
docker start buyindiax-mongodb

# Check logs
docker logs buyindiax-mongodb
```

### Port Already in Use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Docker Not Running
1. Open Docker Desktop
2. Wait for it to start (whale icon in system tray)
3. Try command again

### PowerShell Script Execution Error
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Dependencies Installation Failed
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 🎯 Quick Reference

### Start Application (After Setup)

**Option 1: Development Mode**
```powershell
# Terminal 1: Backend
.\start-dev.ps1

# Terminal 2: Frontend
cd client
npm start
```

**Option 2: Docker**
```powershell
.\start-docker.ps1
```

### Stop Application

**Development Mode:**
- Press `Ctrl + C` in both terminals

**Docker:**
```powershell
docker-compose down
```

---

## 📚 Next Steps

1. ✅ Complete setup using one of the methods above
2. ✅ Access application at http://localhost:3000
3. ✅ Login with admin credentials
4. ✅ Explore features
5. ✅ Read QUICKSTART.md for more details

---

## 🆘 Need Help?

### Check These Files:
- **QUICKSTART.md** - Quick start guide
- **SETUP_SUMMARY.md** - Complete setup overview
- **README.md** - Full documentation

### Common Issues:
1. **MongoDB not connecting** - Check if Docker container is running
2. **Port in use** - Kill process or use different port
3. **Dependencies error** - Clear cache and reinstall

---

## 🎉 Success Checklist

- [ ] Docker Desktop installed and running
- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (npm install)
- [ ] .env file created and configured
- [ ] MongoDB running in Docker
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000

---

Made with ❤️ by Sumant

**Your current location:** `C:\Users\HP\Desktop\BuyIndiaX`
