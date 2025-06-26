# Quick start for Inventory service only
# This script starts the Inventory service and its dependencies using individual compose files

Write-Host "Starting Inventory Service..." -ForegroundColor Green
.\up.ps1 -InventoryService
