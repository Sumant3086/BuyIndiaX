# BuyIndiaX Windows Setup Script
# This script will set up everything you need to run BuyIndiaX

Write-Host "🚀 BuyIndiaX Setup for Windows" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Please run this script as Administrator" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit
}

# Step 1: Check Docker
Write-Host "📦 Step 1: Checking Docker..." -ForegroundColor Green
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit
}

# Step 2: Check Node.js
Write-Host ""
Write-Host "📦 Step 2: Checking Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit
}

# Step 3: Install backend dependencies
Write-Host ""
Write-Host "📦 Step 3: Installing backend dependencies..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit
}

# Step 4: Install frontend dependencies
Write-Host ""
Write-Host "📦 Step 4: Installing frontend dependencies..." -ForegroundColor Green
Set-Location client
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit
}
Set-Location ..

# Step 5: Setup environment file
Write-Host ""
Write-Host "📦 Step 5: Setting up environment file..." -ForegroundColor Green
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ .env file created from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your actual credentials" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Step 6: Start MongoDB with Docker
Write-Host ""
Write-Host "📦 Step 6: Starting MongoDB with Docker..." -ForegroundColor Green
$mongoRunning = docker ps --filter "name=buyindiax-mongodb" --format "{{.Names}}"
if ($mongoRunning -eq "buyindiax-mongodb") {
    Write-Host "✅ MongoDB is already running" -ForegroundColor Green
} else {
    docker run -d `
        --name buyindiax-mongodb `
        -p 27017:27017 `
        -e MONGO_INITDB_ROOT_USERNAME=admin `
        -e MONGO_INITDB_ROOT_PASSWORD=mongopassword123 `
        -v buyindiax-mongodb-data:/data/db `
        mongo:6.0
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB started successfully" -ForegroundColor Green
        Write-Host "   Connection: mongodb://admin:mongopassword123@localhost:27017/buyindiax?authSource=admin" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to start MongoDB" -ForegroundColor Red
    }
}

# Step 7: Wait for MongoDB to be ready
Write-Host ""
Write-Host "⏳ Waiting for MongoDB to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 8: Seed database (optional)
Write-Host ""
$seedDb = Read-Host "Do you want to seed the database with sample products? (y/n)"
if ($seedDb -eq "y" -or $seedDb -eq "Y") {
    Write-Host "📦 Seeding database..." -ForegroundColor Green
    node scripts/seedProducts.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database seeding failed (you can do this later)" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Edit .env file with your credentials:" -ForegroundColor White
Write-Host "   - Update MONGODB_URI if needed" -ForegroundColor Gray
Write-Host "   - Add your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET" -ForegroundColor Gray
Write-Host "   - Add your GOOGLE_API_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the application:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. In another terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd client" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Access the application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - QUICKSTART.md - Quick start guide" -ForegroundColor Gray
Write-Host "   - SETUP_SUMMARY.md - Complete setup summary" -ForegroundColor Gray
Write-Host "   - KUBERNETES_SETUP.md - Kubernetes deployment" -ForegroundColor Gray
Write-Host ""
Write-Host "🐛 Troubleshooting:" -ForegroundColor Yellow
Write-Host "   - Check MongoDB: docker ps" -ForegroundColor Gray
Write-Host "   - View logs: docker logs buyindiax-mongodb" -ForegroundColor Gray
Write-Host "   - Stop MongoDB: docker stop buyindiax-mongodb" -ForegroundColor Gray
Write-Host ""
