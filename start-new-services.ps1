# Start New Backend Services Script
# This script finds and starts any new services with docker-compose.yml files

Write-Host "=== Starting New Backend Services ===" -ForegroundColor Green

# Find all docker-compose.yml files in services directory
$dockerComposeFiles = Get-ChildItem -Path "services" -Recurse -Name "docker-compose.*" | Where-Object { $_ -match "docker-compose\.(yml|yaml)$" }

if ($dockerComposeFiles.Count -eq 0) {
    Write-Host "No docker-compose.yml files found in services directory" -ForegroundColor Yellow
    exit 0
}

foreach ($composeFile in $dockerComposeFiles) {
    $servicePath = Split-Path $composeFile -Parent
    $serviceName = Split-Path $servicePath -Leaf
    
    Write-Host "`n--- Processing $serviceName ---" -ForegroundColor Cyan
    
    # Check if services are already running
    $runningServices = docker compose -f "services/$composeFile" ps --format json | ConvertFrom-Json
    
    if ($runningServices -and ($runningServices | Where-Object { $_.State -eq "running" })) {
        Write-Host "Services already running for ${serviceName}:" -ForegroundColor Yellow
        foreach ($service in $runningServices) {
            $status = if ($service.State -eq "running") { "✅" } else { "❌" }
            Write-Host "  $status $($service.Service): $($service.State)" -ForegroundColor $(if ($service.State -eq "running") { "Green" } else { "Red" })
        }
    } else {
        Write-Host "Starting $serviceName..." -ForegroundColor Green
        try {
            # Run docker compose up with build flag
            $output = docker compose -f "services/$composeFile" up -d --build 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Successfully started $serviceName" -ForegroundColor Green
                
                # Wait a moment for services to initialize
                Start-Sleep -Seconds 3
                
                # Check status after startup
                $newRunningServices = docker compose -f "services/$composeFile" ps --format json | ConvertFrom-Json
                if ($newRunningServices) {
                    Write-Host "Services status:" -ForegroundColor Green
                    foreach ($service in $newRunningServices) {
                        $status = if ($service.State -eq "running") { "✅" } else { "❌" }
                        Write-Host "  $status $($service.Service): $($service.State)" -ForegroundColor $(if ($service.State -eq "running") { "Green" } else { "Red" })
                    }
                }
            } else {
                Write-Host "❌ Failed to start $serviceName" -ForegroundColor Red
                Write-Host "Error output: $output" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Exception starting ${serviceName}: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Service Startup Complete ===" -ForegroundColor Green
Write-Host "Run 'powershell -ExecutionPolicy Bypass -File health-check-services.ps1' to verify all services are healthy" -ForegroundColor Cyan
