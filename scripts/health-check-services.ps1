# Health Check Script for Backend Services
# This script checks the health of all running Docker Compose services

Write-Host "=== Backend Services Health Check ===" -ForegroundColor Green

# Find all docker-compose.yml files in services directory
$dockerComposeFiles = Get-ChildItem -Path "services" -Recurse -Name "docker-compose.*" | Where-Object { $_ -match "docker-compose\.(yml|yaml)$" }

if ($dockerComposeFiles.Count -eq 0) {
    Write-Host "No docker-compose.yml files found in services directory" -ForegroundColor Yellow
    exit 0
}

foreach ($composeFile in $dockerComposeFiles) {
    $servicePath = Split-Path $composeFile -Parent
    $serviceName = Split-Path $servicePath -Leaf
    
    Write-Host "`n--- Checking $serviceName ---" -ForegroundColor Cyan
    
    # Check if services are running
    $runningServices = docker compose -f "services/$composeFile" ps --format json | ConvertFrom-Json
    
    if ($runningServices) {
        Write-Host "Services running:" -ForegroundColor Green
        foreach ($service in $runningServices) {
            $status = if ($service.State -eq "running") { "✅" } else { "❌" }
            Write-Host "  $status $($service.Service): $($service.State)" -ForegroundColor $(if ($service.State -eq "running") { "Green" } else { "Red" })
        }
        
        # Perform health checks based on service type
        switch ($serviceName) {
            "order-service" {
                Write-Host "  Testing health endpoint..." -ForegroundColor Yellow
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:8003/api/v1/health" -Method Get -TimeoutSec 5
                    if ($response.status -eq "healthy") {
                        Write-Host "  Health check passed: $($response.status)" -ForegroundColor Green
                    } else {
                        Write-Host "  Health check failed: $($response.status)" -ForegroundColor Red
                    }
                } catch {
                    Write-Host "  Health check failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            "user-service" {
                Write-Host "  Testing health endpoint..." -ForegroundColor Yellow
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/health" -Method Get -TimeoutSec 5
                    Write-Host "  Health check passed" -ForegroundColor Green
                } catch {
                    Write-Host "  Health check failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            "payment-service" {
                Write-Host "  Testing health endpoint..." -ForegroundColor Yellow
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:8002/api/v1/health" -Method Get -TimeoutSec 5
                    Write-Host "  Health check passed" -ForegroundColor Green
                } catch {
                    Write-Host "  Health check failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            "analytics-service" {
                Write-Host "  Testing health endpoint..." -ForegroundColor Yellow
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:8004/health/" -Method Get -TimeoutSec 5
                    Write-Host "  Health check passed" -ForegroundColor Green
                } catch {
                    Write-Host "  Health check failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            "notification-service" {
                Write-Host "  Testing health endpoint..." -ForegroundColor Yellow
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:8005/api/v1/health" -Method Get -TimeoutSec 5
                    Write-Host "  Health check passed" -ForegroundColor Green
                } catch {
                    Write-Host "  Health check failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
            default {
                Write-Host "  No specific health check configured for $serviceName" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "No services running for $serviceName" -ForegroundColor Red
    }
}

Write-Host "`n=== Health Check Complete ===" -ForegroundColor Green
