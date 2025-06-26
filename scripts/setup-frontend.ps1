# EcoMarket Frontend Setup Script (PowerShell)
# This script sets up both frontend applications for development

param(
    [switch]$SkipDependencyCheck,
    [switch]$Force
)

Write-Host "🚀 Setting up EcoMarket Frontend Applications..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
if (-not $SkipDependencyCheck) {
    try {
        $nodeVersion = node -v
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($versionNumber -lt 18) {
            Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
            exit 1
        }
        
        Write-Success "Node.js $nodeVersion is installed"
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    }

    # Check if npm is installed
    try {
        $npmVersion = npm -v
        Write-Success "npm $npmVersion is installed"
    }
    catch {
        Write-Error "npm is not installed. Please install npm and try again."
        exit 1
    }
}

# Setup Customer Web (Next.js)
Write-Status "Setting up Customer Web (Next.js)..."

if (Test-Path "frontend/customer-web") {
    Push-Location "frontend/customer-web"
    
    try {
        # Install dependencies
        Write-Status "Installing Customer Web dependencies..."
        npm install
        
        # Create environment file if it doesn't exist
        if (-not (Test-Path ".env.local") -or $Force) {
            if (Test-Path ".env.local.example") {
                Write-Status "Creating .env.local from example..."
                Copy-Item ".env.local.example" ".env.local"
                Write-Warning "Please update .env.local with your actual configuration values"
            }
            else {
                Write-Status "Creating basic .env.local file..."
                @"
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
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
            }
        }
        
        Write-Success "Customer Web setup complete"
    }
    catch {
        Write-Error "Failed to setup Customer Web: $($_.Exception.Message)"
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Error "Customer Web directory not found at frontend/customer-web"
}

# Setup Admin Dashboard (React)
Write-Status "Setting up Admin Dashboard (React + TypeScript)..."

if (Test-Path "apps/admin-dashboard") {
    Push-Location "apps/admin-dashboard"
    
    try {
        # Install dependencies
        Write-Status "Installing Admin Dashboard dependencies..."
        npm install
        
        # Create environment file if it doesn't exist
        if (-not (Test-Path ".env") -or $Force) {
            if (Test-Path ".env.example") {
                Write-Status "Creating .env from example..."
                Copy-Item ".env.example" ".env"
                Write-Warning "Please update .env with your actual configuration values"
            }
            else {
                Write-Status "Creating basic .env file..."
                @"
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
"@ | Out-File -FilePath ".env" -Encoding UTF8
            }
        }
        
        Write-Success "Admin Dashboard setup complete"
    }
    catch {
        Write-Error "Failed to setup Admin Dashboard: $($_.Exception.Message)"
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Error "Admin Dashboard directory not found at apps/admin-dashboard"
}

# Print next steps
Write-Host ""
Write-Success "Frontend setup complete! 🎉"
Write-Host ""
Write-Status "Next steps:"
Write-Host "1. Make sure backend services are running:"
Write-Host "   docker-compose up -d postgres redis"
Write-Host ""
Write-Host "2. Start Customer Web (port 3000):"
Write-Host "   cd frontend/customer-web; npm run dev"
Write-Host ""
Write-Host "3. Start Admin Dashboard (port 3001):"
Write-Host "   cd apps/admin-dashboard; npm start"
Write-Host ""
Write-Warning "Don't forget to update environment variables with your actual configuration!"
Write-Host ""

# Check if backend services are running
Write-Status "Checking backend service availability..."

function Test-Port {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Success "$ServiceName is running on port $Port"
            return $true
        }
        else {
            Write-Warning "$ServiceName is not running on port $Port"
            return $false
        }
    }
    catch {
        Write-Warning "Could not check $ServiceName on port $Port"
        return $false
    }
}

# Check backend services
$servicesRunning = 0
if (Get-Command Test-NetConnection -ErrorAction SilentlyContinue) {
    if (Test-Port "User Service" 8001) { $servicesRunning++ }
    if (Test-Port "Product Service" 8002) { $servicesRunning++ }
    if (Test-Port "Order Service" 8003) { $servicesRunning++ }
    if (Test-Port "Payment Service" 8004) { $servicesRunning++ }
    if (Test-Port "Inventory Service" 8005) { $servicesRunning++ }
    
    if ($servicesRunning -eq 0) {
        Write-Warning "No backend services are currently running."
        Write-Status "Start the backend services first for full functionality."
    }
    else {
        Write-Success "$servicesRunning backend services are running"
    }
}
else {
    Write-Warning "Test-NetConnection not available. Cannot check backend service status."
}

Write-Host ""
Write-Success "Setup script completed!"

# Optionally start the applications
$startApps = Read-Host "Would you like to start both applications now? (y/N)"
if ($startApps -eq 'y' -or $startApps -eq 'Y') {
    Write-Status "Starting applications..."
    
    # Start Customer Web in new terminal
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend/customer-web; npm run dev"
    
    # Wait a moment then start Admin Dashboard
    Start-Sleep -Seconds 2
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/admin-dashboard; npm start"
    
    Write-Success "Applications started in separate terminals!"
}
