# Start BuyIndiaX with Docker Compose
# This is the easiest way to run the entire application

Write-Host "🐳 Starting BuyIndiaX with Docker..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop" -ForegroundColor Red
    exit
}

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env file created" -ForegroundColor Green
}

Write-Host "📦 Building and starting containers..." -ForegroundColor Green
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ BuyIndiaX is starting!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "🎉 Application is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
    Write-Host "   Application: http://localhost:5000" -ForegroundColor White
    Write-Host "   MongoDB:     localhost:27017" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 View logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs -f" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🛑 Stop application:" -ForegroundColor Yellow
    Write-Host "   docker-compose down" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    Write-Host "Check logs with: docker-compose logs" -ForegroundColor Yellow
}
