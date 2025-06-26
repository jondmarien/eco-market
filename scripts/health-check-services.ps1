# Health Check Script for Backend Services
# This script checks the health of all running Docker Compose services

# Import service endpoints configuration
. "$PSScriptRoot/service-endpoints.ps1"

Write-Host "=== Backend Services Health Check ===" -ForegroundColor Green

# Load environment variables
$envVars = Get-EnvVariables
# Get service endpoints
$serviceEndpoints = Get-ServiceEndpoints -EnvVars $envVars

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
        
        # Perform health checks using GetEnumerator()
        foreach ($check in $serviceEndpoints.GetEnumerator()) {
            if ($serviceName -eq $check.Key) {
                Write-Host "  Testing health endpoint for $($check.Key)..." -ForegroundColor Yellow
                $result = Test-ServiceHealth -ServiceName $check.Key -Url $check.Value
                Write-Host "  $($result.Message)" -ForegroundColor $(if ($result.Success) { "Green" } else { "Red" })
            }
        }
    } else {
        Write-Host "No services running for $serviceName" -ForegroundColor Red
    }
}

Write-Host "`n=== Health Check Complete ===" -ForegroundColor Green
