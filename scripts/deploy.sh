#!/bin/bash

# BuyIndiaX Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DOCKER_IMAGE="buyindiax"
BACKUP_DIR="/backup"

echo -e "${GREEN}🚀 Starting deployment to ${ENVIRONMENT}...${NC}"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if environment is valid
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create backup (production only)
if [ "$ENVIRONMENT" == "production" ]; then
    print_message "Creating database backup..."
    BACKUP_FILE="${BACKUP_DIR}/backup-$(date +%Y%m%d-%H%M%S).gz"
    docker-compose exec -T mongodb mongodump --archive --gzip > "$BACKUP_FILE" || print_warning "Backup failed"
    print_message "Backup created: $BACKUP_FILE"
fi

# Pull latest code
print_message "Pulling latest code..."
git pull origin $(git branch --show-current)

# Pull latest Docker images
print_message "Pulling latest Docker images..."
docker-compose pull

# Stop existing containers
print_message "Stopping existing containers..."
docker-compose down

# Build and start containers
print_message "Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
print_message "Waiting for services to start..."
sleep 10

# Health check
print_message "Running health check..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_message "Health check passed!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_error "Health check failed after $MAX_RETRIES attempts"
        print_warning "Rolling back..."
        docker-compose down
        docker-compose up -d
        exit 1
    fi
    
    echo "Waiting for application to be ready... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# Show container status
print_message "Container status:"
docker-compose ps

# Show logs
print_message "Recent logs:"
docker-compose logs --tail=50 app

# Cleanup old images
print_message "Cleaning up old Docker images..."
docker system prune -f

# Success message
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Deployment to ${ENVIRONMENT} completed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Application URL: http://localhost:5000"
echo "Health Check: http://localhost:5000/api/health"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose logs -f app"
echo "  Stop:         docker-compose down"
echo "  Restart:      docker-compose restart"
echo "  Status:       docker-compose ps"
echo ""
