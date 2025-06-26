#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Comprehensive EcoMarket Development Environment Orchestrator

.DESCRIPTION
    This script orchestrates the complete EcoMarket development environment, including:
    - Docker Compose backend services infrastructure
    - Frontend applications (customer-web, admin-dashboard, vendor-portal, mobile-app)
    - Health monitoring and status checks
    - Graceful startup and shutdown procedures

.PARAMETER Backend
    Start only backend services (Docker Compose infrastructure)

.PARAMETER Frontend
    Start only frontend applications

.PARAMETER FullStack
    Start complete development environment (backend + frontend)

.PARAMETER CustomerWeb
    Start only customer-web frontend

.PARAMETER AdminDashboard
    Start only admin-dashboard frontend

.PARAMETER VendorPortal
    Start only vendor-portal frontend

.PARAMETER MobileApp
    Start only mobile app (Expo)

.PARAMETER Monitoring
    Include monitoring stack (Prometheus, Grafana)

.PARAMETER HealthCheck
    Run health checks on all services

.PARAMETER Stop
    Stop all development services

.PARAMETER Status
    Show status of all services

.PARAMETER Help
    Show detailed help information

.EXAMPLE
    .\dev.ps1 -FullStack
    Start the complete development environment

.EXAMPLE
    .\dev.ps1 -Backend -Monitoring
    Start only backend services with monitoring

.EXAMPLE
    .\dev.ps1 -CustomerWeb
    Start only the customer web frontend

.EXAMPLE
    .\dev.ps1 -HealthCheck
    Check health of all running services

.EXAMPLE
    .\dev.ps1 -Stop
    Stop all development services
#>

Param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$FullStack,
    [switch]$CustomerWeb,
    [switch]$AdminDashboard,
    [switch]$VendorPortal,
    [switch]$MobileApp,
    [switch]$Monitoring,
    [switch]$HealthCheck,
    [switch]$Stop,
    [switch]$Status,
    [switch]$Help
)

# Global variables
$Global:FrontendProcesses = @()
$Global:LogDirectory = "logs"

function Show-Help {
    Write-Host @"
=============================================================================
    EcoMarket Development Environment Orchestrator
=============================================================================

USAGE:
    .\dev.ps1 [OPTIONS]

MAIN OPTIONS:
    -FullStack                  Start complete development environment
    -Backend                    Start only backend services (Docker Compose)
    -Frontend                   Start all frontend applications
    -Monitoring                 Include monitoring stack (Prometheus, Grafana)

INDIVIDUAL FRONTEND OPTIONS:
    -CustomerWeb                Start customer-web (Next.js)
    -AdminDashboard             Start admin-dashboard (React)
    -VendorPortal               Start vendor-portal (React)
    -MobileApp                  Start mobile app (Expo)

UTILITY OPTIONS:
    -HealthCheck                Run health checks on all services
    -Status                     Show status of all services
    -Stop                       Stop all development services
    -Help                       Show this help message

EXAMPLES:
    # Start everything
    .\dev.ps1 -FullStack

    # Start backend with monitoring
    .\dev.ps1 -Backend -Monitoring

    # Start specific frontend
    .\dev.ps1 -CustomerWeb

    # Start all frontends
    .\dev.ps1 -Frontend

    # Check service health
    .\dev.ps1 -HealthCheck

    # Stop everything
    .\dev.ps1 -Stop

INFRASTRUCTURE DETAILS:
    Docker Compose Files:
    - Primary: infrastructure/docker-compose.dev.yml
    - Monitoring: infrastructure/docker-compose.monitoring.yml

    Frontend Applications:
    - customer-web: Next.js (http://localhost:3000)
    - admin-dashboard: React CRA (http://localhost:3001) 
    - vendor-portal: React CRA (http://localhost:3002)
    - mobile-app: Expo (http://localhost:19006)

    Backend Services:
    - user-service: http://localhost:8001
    - payment-service: http://localhost:7000
    - order-service: http://localhost:8003
    - product-catalog: http://localhost:8000
    - inventory-service: http://localhost:8005
    - analytics-service: http://localhost:9000
    - notification-service: http://localhost:9001

=============================================================================
"@
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Yellow
    Write-Host "=" * 80 -ForegroundColor Cyan
}

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
    Write-Host "$Message" -ForegroundColor $color
}

function Initialize-Environment {
    Write-Status "Initializing development environment..." "INFO"
    
    # Create logs directory
    if (!(Test-Path $LogDirectory)) {
        New-Item -ItemType Directory -Path $LogDirectory | Out-Null
        Write-Status "Created logs directory" "SUCCESS"
    }
    
    # Check required files
    $requiredFiles = @(
        "infrastructure/docker-compose.dev.yml",
        "frontend/customer-web/package.json",
        "apps/admin-dashboard/package.json",
        "apps/vendor-portal/package.json",
        "mobile-app/package.json"
    )
    
    foreach ($file in $requiredFiles) {
        if (!(Test-Path $file)) {
            Write-Status "Required file missing: $file" "ERROR"
            return $false
        }
    }
    
    Write-Status "Environment validation complete" "SUCCESS"
    return $true
}

function Start-BackendServices {
    param([bool]$IncludeMonitoring = $false)
    
    Write-Section "STARTING BACKEND SERVICES"
    
    # Prepare Docker Compose command
    $composeFiles = @("infrastructure/docker-compose.dev.yml")
    if ($IncludeMonitoring) {
        $composeFiles += "infrastructure/docker-compose.monitoring.yml"
    }
    
    $composeArgs = @()
    foreach ($file in $composeFiles) {
        $composeArgs += "-f", $file
    }
    $composeArgs += "up", "-d", "--build"
    
    Write-Status "Starting Docker Compose services..." "INFO"
    Write-Status "Compose files: $($composeFiles -join ', ')" "INFO"
    
    try {
        $result = docker compose @composeArgs 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Backend services started successfully" "SUCCESS"
            
            # Wait for services to initialize
            Write-Status "Waiting for services to initialize..." "INFO"
            Start-Sleep -Seconds 10
            
            # Run health check
            Invoke-HealthCheck
        } else {
            Write-Status "Failed to start backend services" "ERROR"
            Write-Status "Error: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Status "Exception starting backend services: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

function Start-FrontendApp {
    param(
        [string]$AppName,
        [string]$Directory,
        [string]$Command,
        [int]$Port
    )
    
    Write-Status "Starting $AppName..." "INFO"
    
    if (!(Test-Path $Directory)) {
        Write-Status "$AppName directory not found: $Directory" "ERROR"
        return $null
    }
    
    # Check if port is already in use
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Status "$AppName port $Port is already in use" "WARNING"
            return $null
        }
    } catch {
        # Port is available
    }
    
    try {
        # Start the frontend application
        $processArgs = @{
            FilePath = "npm"
            ArgumentList = @("run", $Command)
            WorkingDirectory = $Directory
            RedirectStandardOutput = "$LogDirectory/$AppName.log"
            RedirectStandardError = "$LogDirectory/$AppName.error.log"
            PassThru = $true
        }
        
        $process = Start-Process @processArgs
        
        if ($process) {
            Write-Status "$AppName started (PID: $($process.Id), Port: $Port)" "SUCCESS"
            return $process
        } else {
            Write-Status "Failed to start $AppName" "ERROR"
            return $null
        }
    } catch {
        Write-Status "Exception starting $AppName: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Start-AllFrontends {
    Write-Section "STARTING FRONTEND APPLICATIONS"
    
    # Define frontend applications
    $frontendApps = @(
        @{
            Name = "customer-web"
            Directory = "frontend/customer-web"
            Command = "dev"
            Port = 3000
        },
        @{
            Name = "admin-dashboard"
            Directory = "apps/admin-dashboard"
            Command = "start"
            Port = 3001
        },
        @{
            Name = "vendor-portal"
            Directory = "apps/vendor-portal"
            Command = "start"
            Port = 3002
        },
        @{
            Name = "mobile-app"
            Directory = "mobile-app"
            Command = "start"
            Port = 19006
        }
    )
    
    foreach ($app in $frontendApps) {
        $process = Start-FrontendApp -AppName $app.Name -Directory $app.Directory -Command $app.Command -Port $app.Port
        if ($process) {
            $Global:FrontendProcesses += @{
                Name = $app.Name
                Process = $process
                Port = $app.Port
            }
        }
    }
    
    if ($Global:FrontendProcesses.Count -gt 0) {
        Write-Status "Started $($Global:FrontendProcesses.Count) frontend applications" "SUCCESS"
        Show-FrontendUrls
    } else {
        Write-Status "No frontend applications were started" "WARNING"
    }
}

function Start-SpecificFrontend {
    param([string]$AppName)
    
    $appConfigs = @{
        "customer-web" = @{
            Directory = "frontend/customer-web"
            Command = "dev"
            Port = 3000
        }
        "admin-dashboard" = @{
            Directory = "apps/admin-dashboard"
            Command = "start"
            Port = 3001
        }
        "vendor-portal" = @{
            Directory = "apps/vendor-portal"
            Command = "start"
            Port = 3002
        }
        "mobile-app" = @{
            Directory = "mobile-app"
            Command = "start"
            Port = 19006
        }
    }
    
    if ($appConfigs.ContainsKey($AppName)) {
        $config = $appConfigs[$AppName]
        Write-Section "STARTING $($AppName.ToUpper())"
        
        $process = Start-FrontendApp -AppName $AppName -Directory $config.Directory -Command $config.Command -Port $config.Port
        if ($process) {
            $Global:FrontendProcesses += @{
                Name = $AppName
                Process = $process
                Port = $config.Port
            }
            Show-SingleAppUrl -AppName $AppName -Port $config.Port
        }
    } else {
        Write-Status "Unknown frontend application: $AppName" "ERROR"
    }
}

function Show-FrontendUrls {
    Write-Host "`nFRONTEND APPLICATIONS:" -ForegroundColor Yellow
    Write-Host "🌐 Customer Web:    http://localhost:3000" -ForegroundColor Cyan
    Write-Host "👨‍💼 Admin Dashboard: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "🏪 Vendor Portal:   http://localhost:3002" -ForegroundColor Cyan
    Write-Host "📱 Mobile App:      http://localhost:19006" -ForegroundColor Cyan
}

function Show-SingleAppUrl {
    param([string]$AppName, [int]$Port)
    
    $emoji = switch ($AppName) {
        "customer-web" { "🌐" }
        "admin-dashboard" { "👨‍💼" }
        "vendor-portal" { "🏪" }
        "mobile-app" { "📱" }
        default { "🚀" }
    }
    
    Write-Host "`n$emoji $AppName is running at: http://localhost:$Port" -ForegroundColor Green
}

function Invoke-HealthCheck {
    Write-Section "HEALTH CHECKS"
    
    $healthEndpoints = @(
        @{ Name = "User Service"; Url = "http://localhost:8001/api/v1/health" },
        @{ Name = "Payment Service"; Url = "http://localhost:7000/api/v1/health" },
        @{ Name = "Order Service"; Url = "http://localhost:8003/api/v1/health" },
        @{ Name = "Analytics Service"; Url = "http://localhost:9000/health/" },
        @{ Name = "Notification Service"; Url = "http://localhost:9001/api/v1/health" },
        @{ Name = "Product Catalog"; Url = "http://localhost:8000/docs" }
    )
    
    foreach ($endpoint in $healthEndpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint.Url -Method Get -TimeoutSec 5 -ErrorAction Stop
            Write-Status "✅ $($endpoint.Name): Healthy" "SUCCESS"
        } catch {
            Write-Status "❌ $($endpoint.Name): Unhealthy ($($_.Exception.Message))" "ERROR"
        }
    }
    
    # Check frontend applications
    Write-Host "`nFRONTEND STATUS:" -ForegroundColor Yellow
    foreach ($app in $Global:FrontendProcesses) {
        if ($app.Process -and !$app.Process.HasExited) {
            Write-Status "✅ $($app.Name): Running (PID: $($app.Process.Id))" "SUCCESS"
        } else {
            Write-Status "❌ $($app.Name): Not running" "ERROR"
        }
    }
}

function Show-ServiceStatus {
    Write-Section "SERVICE STATUS"
    
    # Docker services status
    Write-Host "BACKEND SERVICES:" -ForegroundColor Yellow
    try {
        $services = docker compose -f infrastructure/docker-compose.dev.yml ps --format json | ConvertFrom-Json
        if ($services) {
            foreach ($service in $services) {
                $status = if ($service.State -eq "running") { "✅" } else { "❌" }
                $color = if ($service.State -eq "running") { "Green" } else { "Red" }
                Write-Host "  $status $($service.Service): $($service.State)" -ForegroundColor $color
            }
        } else {
            Write-Status "No backend services running" "WARNING"
        }
    } catch {
        Write-Status "Error checking backend services: $($_.Exception.Message)" "ERROR"
    }
    
    # Frontend status
    Write-Host "`nFRONTEND SERVICES:" -ForegroundColor Yellow
    if ($Global:FrontendProcesses.Count -gt 0) {
        foreach ($app in $Global:FrontendProcesses) {
            if ($app.Process -and !$app.Process.HasExited) {
                Write-Host "  ✅ $($app.Name): Running (PID: $($app.Process.Id), Port: $($app.Port))" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $($app.Name): Stopped" -ForegroundColor Red
            }
        }
    } else {
        Write-Status "  No frontend services running" "WARNING"
    }
}

function Stop-AllServices {
    Write-Section "STOPPING ALL SERVICES"
    
    # Stop frontend processes
    if ($Global:FrontendProcesses.Count -gt 0) {
        Write-Status "Stopping frontend applications..." "INFO"
        foreach ($app in $Global:FrontendProcesses) {
            if ($app.Process -and !$app.Process.HasExited) {
                try {
                    Stop-Process -Id $app.Process.Id -Force
                    Write-Status "Stopped $($app.Name)" "SUCCESS"
                } catch {
                    Write-Status "Error stopping $($app.Name): $($_.Exception.Message)" "ERROR"
                }
            }
        }
        $Global:FrontendProcesses = @()
    }
    
    # Stop Docker services
    Write-Status "Stopping backend services..." "INFO"
    try {
        docker compose -f infrastructure/docker-compose.dev.yml down
        if (Test-Path "infrastructure/docker-compose.monitoring.yml") {
            docker compose -f infrastructure/docker-compose.monitoring.yml down
        }
        Write-Status "Backend services stopped" "SUCCESS"
    } catch {
        Write-Status "Error stopping backend services: $($_.Exception.Message)" "ERROR"
    }
    
    Write-Status "All services stopped" "SUCCESS"
}

function Register-ShutdownHandler {
    # Register Ctrl+C handler
    [console]::TreatControlCAsInput = $false
    $null = Register-EngineEvent PowerShell.Exiting -Action {
        Write-Host "`nShutting down..." -ForegroundColor Yellow
        Stop-AllServices
    }
}

# Main execution logic
if ($Help) {
    Show-Help
    exit 0
}

if ($Stop) {
    Stop-AllServices
    exit 0
}

if ($Status) {
    Show-ServiceStatus
    exit 0
}

if ($HealthCheck) {
    Invoke-HealthCheck
    exit 0
}

# Initialize environment
if (!(Initialize-Environment)) {
    Write-Status "Environment initialization failed" "ERROR"
    exit 1
}

# Register shutdown handler
Register-ShutdownHandler

# Determine what to start
$startBackend = $Backend -or $FullStack
$startFrontend = $Frontend -or $FullStack
$startSpecific = $CustomerWeb -or $AdminDashboard -or $VendorPortal -or $MobileApp

if (!$startBackend -and !$startFrontend -and !$startSpecific) {
    Write-Status "No services specified. Use -Help for usage information." "WARNING"
    Show-Help
    exit 0
}

# Start backend services
if ($startBackend) {
    if (!(Start-BackendServices -IncludeMonitoring:$Monitoring)) {
        Write-Status "Failed to start backend services" "ERROR"
        exit 1
    }
}

# Start frontend services
if ($startFrontend) {
    Start-AllFrontends
} elseif ($startSpecific) {
    if ($CustomerWeb) { Start-SpecificFrontend "customer-web" }
    if ($AdminDashboard) { Start-SpecificFrontend "admin-dashboard" }
    if ($VendorPortal) { Start-SpecificFrontend "vendor-portal" }
    if ($MobileApp) { Start-SpecificFrontend "mobile-app" }
}

# Show final status
Write-Section "DEVELOPMENT ENVIRONMENT READY"

if ($startBackend) {
    Write-Host "BACKEND SERVICES:" -ForegroundColor Yellow
    Write-Host "🔧 Product Catalog:    http://localhost:8000" -ForegroundColor Cyan
    Write-Host "👤 User Service:       http://localhost:8001" -ForegroundColor Cyan  
    Write-Host "💳 Payment Service:    http://localhost:7000" -ForegroundColor Cyan
    Write-Host "📦 Order Service:      http://localhost:8003" -ForegroundColor Cyan
    Write-Host "📊 Inventory Service:  http://localhost:8005" -ForegroundColor Cyan
    Write-Host "📈 Analytics Service:  http://localhost:9000" -ForegroundColor Cyan
    Write-Host "🔔 Notification:       http://localhost:9001" -ForegroundColor Cyan
    Write-Host "🗃️  pgAdmin:            http://localhost:8080 (admin@ecomarket.dev / admin)" -ForegroundColor Cyan
    Write-Host "🔧 Redis Commander:    http://localhost:8082" -ForegroundColor Cyan
    
    if ($Monitoring) {
        Write-Host "📊 Grafana:            http://localhost:3000 (admin / admin)" -ForegroundColor Cyan
        Write-Host "🎯 Prometheus:         http://localhost:9090" -ForegroundColor Cyan
    }
}

if ($startFrontend -or $startSpecific) {
    Show-FrontendUrls
}

Write-Host "`nCOMMANDS:" -ForegroundColor Yellow
Write-Host "  .\dev.ps1 -HealthCheck    # Check service health" -ForegroundColor Gray
Write-Host "  .\dev.ps1 -Status         # Show service status" -ForegroundColor Gray
Write-Host "  .\dev.ps1 -Stop           # Stop all services" -ForegroundColor Gray

Write-Status "Press Ctrl+C to stop all services" "INFO"

# Keep script running to maintain frontend processes
if ($Global:FrontendProcesses.Count -gt 0) {
    try {
        while ($true) {
            # Check if any frontend processes have exited
            $deadProcesses = $Global:FrontendProcesses | Where-Object { $_.Process.HasExited }
            if ($deadProcesses) {
                foreach ($dead in $deadProcesses) {
                    Write-Status "$($dead.Name) has exited unexpectedly" "WARNING"
                }
                # Remove dead processes from the list
                $Global:FrontendProcesses = $Global:FrontendProcesses | Where-Object { !$_.Process.HasExited }
                
                if ($Global:FrontendProcesses.Count -eq 0) {
                    Write-Status "All frontend processes have exited" "WARNING"
                    break
                }
            }
            Start-Sleep -Seconds 5
        }
    } catch {
        Write-Status "Interrupted" "INFO"
    } finally {
        Stop-AllServices
    }
}
