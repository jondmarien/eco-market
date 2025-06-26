#!/usr/bin/env pwsh

# Simple wrapper script to start development environment with FullStack option
# This bypasses the parameter parsing issues in the main script

Write-Host "Starting EcoMarket Development Environment..." -ForegroundColor Green

# Set environment variables
$env:NODE_ENV = "development"

# Force the FullStack parameter by setting variables directly
$FullStack = $true
$Backend = $false
$Frontend = $false
$CustomerWeb = $false
$AdminDashboard = $false
$VendorPortal = $false
$MobileApp = $false
$Monitoring = $false
$HealthCheck = $false
$Stop = $false
$Status = $false
$Help = $false

# Dot source the main script to inherit its functions and execute with our variables
try {
    . "$PSScriptRoot/dev.ps1"
} catch {
    Write-Host "Error executing main dev script: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Falling back to direct docker compose..." -ForegroundColor Yellow
    
    # Fallback: start docker compose directly
    docker compose -f infrastructure/docker-compose.dev.yml up -d --build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend services started successfully" -ForegroundColor Green
        Write-Host "Frontend services need to be started manually:" -ForegroundColor Yellow
        Write-Host "  cd frontend/customer-web && npm run dev" -ForegroundColor Cyan
        Write-Host "  cd apps/admin-dashboard && npm start" -ForegroundColor Cyan
        Write-Host "  cd apps/vendor-portal && npm start" -ForegroundColor Cyan
        Write-Host "  cd mobile-app && npm start" -ForegroundColor Cyan
    }
}
