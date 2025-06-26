# Start all services with monitoring
# This script starts the complete development environment including monitoring services

Write-Host "Starting Complete EcoMarket Development Environment..." -ForegroundColor Green
.\up.ps1 -AllServices -Monitoring
