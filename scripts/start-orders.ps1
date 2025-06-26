# Quick start for Order service only
# This script starts the Order service and its dependencies using individual compose files

Write-Host "Starting Order Service..." -ForegroundColor Green
.\up.ps1 -OrderService
