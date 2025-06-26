#!/bin/bash

# EcoMarket Frontend Setup Script
# This script sets up both frontend applications for development

set -e

echo "🚀 Setting up EcoMarket Frontend Applications..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "npm $(npm -v) is installed"

# Setup Customer Web (Next.js)
print_status "Setting up Customer Web (Next.js)..."

if [ -d "frontend/customer-web" ]; then
    cd frontend/customer-web
    
    # Install dependencies
    print_status "Installing Customer Web dependencies..."
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.local.example" ]; then
            print_status "Creating .env.local from example..."
            cp .env.local.example .env.local
            print_warning "Please update .env.local with your actual configuration values"
        else
            print_status "Creating basic .env.local file..."
            cat > .env.local << EOF
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:8002
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:8003
NEXT_PUBLIC_PAYMENT_SERVICE_URL=http://localhost:8004

# Authentication
NEXT_PUBLIC_AUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PAYMENTS=true
EOF
        fi
    fi
    
    print_success "Customer Web setup complete"
    cd ../../
else
    print_error "Customer Web directory not found at frontend/customer-web"
fi

# Setup Admin Dashboard (React)
print_status "Setting up Admin Dashboard (React + TypeScript)..."

if [ -d "apps/admin-dashboard" ]; then
    cd apps/admin-dashboard
    
    # Install dependencies
    print_status "Installing Admin Dashboard dependencies..."
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_status "Creating .env from example..."
            cp .env.example .env
            print_warning "Please update .env with your actual configuration values"
        else
            print_status "Creating basic .env file..."
            cat > .env << EOF
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8001
REACT_APP_USER_SERVICE_URL=http://localhost:8001
REACT_APP_PRODUCT_SERVICE_URL=http://localhost:8002
REACT_APP_ORDER_SERVICE_URL=http://localhost:8003
REACT_APP_PAYMENT_SERVICE_URL=http://localhost:8004
REACT_APP_ANALYTICS_SERVICE_URL=http://localhost:8006

# Authentication
REACT_APP_AUTH_SECRET=admin-secret-change-in-production

# Admin Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_REPORTS=true
REACT_APP_DEBUG_MODE=false
EOF
        fi
    fi
    
    print_success "Admin Dashboard setup complete"
    cd ../../
else
    print_error "Admin Dashboard directory not found at apps/admin-dashboard"
fi

# Print next steps
echo ""
print_success "Frontend setup complete! 🎉"
echo ""
print_status "Next steps:"
echo "1. Make sure backend services are running:"
echo "   docker-compose up -d postgres redis"
echo ""
echo "2. Start Customer Web (port 3000):"
echo "   cd frontend/customer-web && npm run dev"
echo ""
echo "3. Start Admin Dashboard (port 3001):"
echo "   cd apps/admin-dashboard && npm start"
echo ""
print_warning "Don't forget to update environment variables with your actual configuration!"
echo ""

# Check if backend services are running
print_status "Checking backend service availability..."

check_service() {
    local service_name=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        print_success "$service_name is running on port $port"
        return 0
    else
        print_warning "$service_name is not running on port $port"
        return 1
    fi
}

# Check backend services
services_running=0
if command -v nc &> /dev/null; then
    check_service "User Service" 8001 && ((services_running++))
    check_service "Product Service" 8002 && ((services_running++))
    check_service "Order Service" 8003 && ((services_running++))
    check_service "Payment Service" 8004 && ((services_running++))
    check_service "Inventory Service" 8005 && ((services_running++))
    
    if [ $services_running -eq 0 ]; then
        print_warning "No backend services are currently running."
        print_status "Start the backend services first for full functionality."
    else
        print_success "$services_running backend services are running"
    fi
else
    print_warning "netcat (nc) not available. Cannot check backend service status."
fi

echo ""
print_success "Setup script completed!"
