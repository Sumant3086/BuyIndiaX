# Start BuyIndiaX in Development Mode
# This script starts both backend and frontend

Write-Host "🚀 Starting BuyIndiaX..." -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "📦 Checking MongoDB..." -ForegroundColor Green
$mongoRunning = docker ps --filter "name=buyindiax-mongodb" --format "{{.Names}}"
if ($mongoRunning -ne "buyindiax-mongodb") {
    Write-Host "⚠️  MongoDB is not running. Starting MongoDB..." -ForegroundColor Yellow
    docker start buyindiax-mongodb
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to start MongoDB. Run setup-windows.ps1 first" -ForegroundColor Red
        exit
    }
    Start-Sleep -Seconds 3
}
Write-Host "✅ MongoDB is running" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found. Run setup-windows.ps1 first" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🌐 Starting Backend Server..." -ForegroundColor Green
Write-Host "   Backend will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 To start the frontend, open another terminal and run:" -ForegroundColor Yellow
Write-Host "   cd client" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start backend
npm run dev
