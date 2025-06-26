#!/usr/bin/env pwsh
# Set-StrictMode -Version Latest  # Commented out to avoid parameter initialization issues

param (
    [Parameter(HelpMessage="Start only backend services (Docker Compose infrastructure)")]
    [switch] $Backend,

    [Parameter(HelpMessage="Start all frontend applications")]
    [switch] $Frontend,

    [Parameter(HelpMessage="Start complete development environment (backend + frontend)")]
    [switch] $FullStack,

    [Parameter(HelpMessage="Start only customer-web frontend")]
    [switch] $CustomerWeb,

    [Parameter(HelpMessage="Start only admin-dashboard frontend")]
    [switch] $AdminDashboard,

    [Parameter(HelpMessage="Start only vendor-portal frontend")]
    [switch] $VendorPortal,

    [Parameter(HelpMessage="Start only mobile app (Expo)")]
    [switch] $MobileApp,

    [Parameter(HelpMessage="Include monitoring stack (Prometheus, Grafana)")]
    [switch] $Monitoring,

    [Parameter(HelpMessage="Run health checks on all services")]
    [switch] $HealthCheck,

    [Parameter(HelpMessage="Stop all development services")]
    [switch] $Stop,

    [Parameter(HelpMessage="Show status of all services")]
    [switch] $Status,

    [Parameter(HelpMessage="Show detailed help information")]
    [switch] $Help
)

# Initialize switch parameters to false if not set
if (-not $PSBoundParameters.ContainsKey('Backend')) { $Backend = $false }
if (-not $PSBoundParameters.ContainsKey('Frontend')) { $Frontend = $false }
if (-not $PSBoundParameters.ContainsKey('FullStack')) { $FullStack = $false }
if (-not $PSBoundParameters.ContainsKey('CustomerWeb')) { $CustomerWeb = $false }
if (-not $PSBoundParameters.ContainsKey('AdminDashboard')) { $AdminDashboard = $false }
if (-not $PSBoundParameters.ContainsKey('VendorPortal')) { $VendorPortal = $false }
if (-not $PSBoundParameters.ContainsKey('MobileApp')) { $MobileApp = $false }
if (-not $PSBoundParameters.ContainsKey('Monitoring')) { $Monitoring = $false }
if (-not $PSBoundParameters.ContainsKey('HealthCheck')) { $HealthCheck = $false }
if (-not $PSBoundParameters.ContainsKey('Stop')) { $Stop = $false }
if (-not $PSBoundParameters.ContainsKey('Status')) { $Status = $false }
if (-not $PSBoundParameters.ContainsKey('Help')) { $Help = $false }

function Enable-UnicodeOutput {
    try {
        $PSStyle.OutputRendering = 'Ansi'
    } catch {}
    if ($IsWindows) {
        chcp 65001 | Out-Null
        $OutputEncoding = [Text.UTF8Encoding]::new($false)
        [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
    }
}

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
    Start all frontend applications

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
    ./dev.ps1 -FullStack
    Start the complete development environment with both backend services and all frontend applications

.EXAMPLE
    ./dev.ps1 -Monitoring -Status
    Include monitoring stack and show status of all services

.EXAMPLE
    ./dev.ps1 -Backend -Monitoring
    Start only backend services with monitoring stack (Prometheus, Grafana)

.EXAMPLE
    ./dev.ps1 -Frontend
    Start all frontend applications (customer-web, admin-dashboard, vendor-portal, mobile-app)

.EXAMPLE
    ./dev.ps1 -CustomerWeb
    Start only the customer web frontend application

.EXAMPLE
    ./dev.ps1 -AdminDashboard -VendorPortal
    Start only the admin dashboard and vendor portal frontend applications

.EXAMPLE
    ./dev.ps1 -MobileApp
    Start only the mobile app (Expo) frontend

.EXAMPLE
    ./dev.ps1 -HealthCheck
    Run health checks on all running services

.EXAMPLE
    ./dev.ps1 -Status
    Show status of all backend and frontend services

.EXAMPLE
    ./dev.ps1 -Stop
    Stop all development services (backend and frontend)

.EXAMPLE
    ./dev.ps1 -Help
    Show detailed help information with usage examples
#>

# Initialize Unicode output
Enable-UnicodeOutput

# Check if Unicode output is working
$UseUnicode = $true
try {
    [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
    $testOutput = "🚀"
    # If we can't properly encode/decode unicode, fall back to ASCII
    if ([System.Text.Encoding]::UTF8.GetBytes($testOutput).Length -le 1) {
        $UseUnicode = $false
    }
} catch {
    $UseUnicode = $false
}

# Emoji variables with Unicode/ASCII fallback
$EmojiHourglass = if ($UseUnicode) { "⏳" } else { "[WAIT]" }
$EmojiCheckMark = if ($UseUnicode) { "✅" } else { "[OK]" }
$EmojiWarning = if ($UseUnicode) { "⚠️" } else { "[WARN]" }
$EmojiCrossMark = if ($UseUnicode) { "❌" } else { "[FAIL]" }
$EmojiCustomerWeb = if ($UseUnicode) { "🌐" } else { "[WEB]" }
$EmojiAdminDashboard = if ($UseUnicode) { "👨‍💼" } else { "[ADMIN]" }
$EmojiVendorPortal = if ($UseUnicode) { "🏪" } else { "[VENDOR]" }
$EmojiMobileApp = if ($UseUnicode) { "📱" } else { "[MOBILE]" }
$EmojiRocket = if ($UseUnicode) { "🚀" } else { "[APP]" }
$EmojiHospital = if ($UseUnicode) { "🏥" } else { "[HEALTH]" }
$EmojiWrench = if ($UseUnicode) { "🔧" } else { "[TOOL]" }
$EmojiPerson = if ($UseUnicode) { "👤" } else { "[USER]" }
$EmojiCreditCard = if ($UseUnicode) { "💳" } else { "[PAY]" }
$EmojiPackage = if ($UseUnicode) { "📦" } else { "[ORDER]" }
$EmojiBarChart = if ($UseUnicode) { "📊" } else { "[DATA]" }
$EmojiTrendingUp = if ($UseUnicode) { "📈" } else { "[ANALYTICS]" }
$EmojiBell = if ($UseUnicode) { "🔔" } else { "[NOTIFY]" }
$EmojiFileCabinet = if ($UseUnicode) { "🗃️" } else { "[DB]" }
$EmojiTarget = if ($UseUnicode) { "🎯" } else { "[METRICS]" }

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
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Cyan
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
    
    # Load .env file if it exists
    if (Test-Path ".env") {
        Write-Status "Loading environment variables from .env file..." "INFO"
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^#][^=]*)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
                Write-Status "Set $name=$value" "SUCCESS"
            }
        }
    } else {
        Write-Status ".env file not found - using default values" "WARNING"
    }
    
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
            
            # Wait for critical endpoints to be ready before continuing
            Write-Status "$EmojiHourglass Waiting for critical endpoints to be ready..." "INFO"
            Write-Status "  Checking http://localhost:8000/api/v1/health" "INFO"
            Write-Status "  Checking http://localhost:3000" "INFO"
            
            try {
                # Use npx wait-on to ensure critical endpoints respond
                & npx wait-on http://localhost:8000/api/v1/health http://localhost:3000 --timeout 60000 --interval 2000 --log
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Status "$EmojiCheckMark Critical endpoints are ready" "SUCCESS"
                } else {
                    Write-Status "$EmojiWarning Some endpoints may not be ready, continuing anyway..." "WARNING"
                }
            } catch {
                Write-Status "$EmojiWarning Wait-on check failed: $($_.Exception.Message)" "WARNING"
                Write-Status "   Continuing with startup..." "INFO"
            }
            
            # Run initial health check
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
        [int]$Port,
        [hashtable]$EnvVars = @{}
    )
    
    Write-Status "Starting $AppName..." "INFO"
    
    # Resolve absolute path from project root
    $AbsoluteDirectory = Join-Path (Get-Location) $Directory
    
    if (!(Test-Path $AbsoluteDirectory)) {
        Write-Status "$AppName directory not found: $AbsoluteDirectory" "ERROR"
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
        # Start the frontend application in a visible terminal
        if ($IsWindows) {
            # Build environment variable commands for PowerShell
            $envCommands = ""
            foreach ($envVar in $EnvVars.GetEnumerator()) {
                $envCommands += "[Environment]::SetEnvironmentVariable('$($envVar.Key)', '$($envVar.Value)', 'Process'); "
            }
            
            # Use regular PowerShell windows instead of Windows Terminal to avoid complexity
            $command = "Set-Location '$AbsoluteDirectory'; $envCommands npm run $Command"
            $proc = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $command) -PassThru
        } else {
            # macOS/Linux fallback - open new terminal with appropriate command
            if ($IsMacOS) {
                # macOS: Use osascript to open new Terminal tab
                $script = "tell application `"Terminal`" to do script `"cd '$AbsoluteDirectory' && npm run $Command'`""
                $proc = Start-Process -FilePath 'osascript' -ArgumentList @('-e', $script) -PassThru
            } elseif ($IsLinux) {
                # Linux: Try common terminal emulators
                $terminalFound = $false
                $terminals = @('gnome-terminal', 'xterm', 'konsole', 'xfce4-terminal')
                
                foreach ($terminal in $terminals) {
                    $termPath = (Get-Command $terminal -ErrorAction SilentlyContinue)?.Source
                    if ($termPath) {
                        switch ($terminal) {
                            'gnome-terminal' {
                                $proc = Start-Process -FilePath $terminal -ArgumentList @('--', 'bash', '-c', "cd '$AbsoluteDirectory' && npm run $Command; exec bash") -PassThru
                            }
                            'konsole' {
                                $proc = Start-Process -FilePath $terminal -ArgumentList @('-e', 'bash', '-c', "cd '$AbsoluteDirectory' && npm run $Command; exec bash") -PassThru
                            }
                            'xfce4-terminal' {
                                $proc = Start-Process -FilePath $terminal -ArgumentList @('--command', "bash -c `"cd '$AbsoluteDirectory' && npm run $Command; exec bash`"") -PassThru
                            }
                            default {
                                # xterm and others
                                $proc = Start-Process -FilePath $terminal -ArgumentList @('-e', 'bash', '-c', "cd '$AbsoluteDirectory' && npm run $Command; exec bash") -PassThru
                            }
                        }
                        $terminalFound = $true
                        break
                    }
                }
                
                if (-not $terminalFound) {
                    Write-Status "No supported terminal emulator found. Please install gnome-terminal, xterm, konsole, or xfce4-terminal" "WARNING"
                    Write-Status "Falling back to background process (no terminal window)" "INFO"
                    # TODO: Implement background process fallback
                    $proc = $null
                }
            } else {
                Write-Status "Unsupported platform for terminal launching. Running in background..." "WARNING"
                # TODO: Implement cross-platform background process fallback
                $proc = $null
            }
        }
        
        $process = $proc
        
        if ($process) {
            Write-Status "$AppName started (PID: $($process.Id), Port: $Port)" "SUCCESS"
            return $process
        } else {
            Write-Status "Failed to start $AppName" "ERROR"
            return $null
        }
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Status "Exception starting ${AppName}: $errorMsg" "ERROR"
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
            EnvVars = @{"PORT" = "3001"}
        },
        @{
            Name = "vendor-portal"
            Directory = "apps/vendor-portal"
            Command = "start"
            Port = 3002
            EnvVars = @{"PORT" = "3002"}
        },
        @{
            Name = "mobile-app"
            Directory = "mobile-app"
            Command = "start"
            Port = 19006
        }
    )
    
    foreach ($app in $frontendApps) {
        $envVars = if ($app.EnvVars) { $app.EnvVars } else { @{} }
        $process = Start-FrontendApp -AppName $app.Name -Directory $app.Directory -Command $app.Command -Port $app.Port -EnvVars $envVars
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
    Write-Host "${EmojiCustomerWeb} Customer Web:    http://localhost:3000" -ForegroundColor Cyan
    Write-Host "${EmojiAdminDashboard} Admin Dashboard: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "${EmojiVendorPortal} Vendor Portal:   http://localhost:3002" -ForegroundColor Cyan
    Write-Host "${EmojiMobileApp} Mobile App:      http://localhost:19006" -ForegroundColor Cyan
}

function Show-SingleAppUrl {
    param([string]$AppName, [int]$Port)
    
    $emoji = switch ($AppName) {
        "customer-web" { $EmojiCustomerWeb }
        "admin-dashboard" { $EmojiAdminDashboard }
        "vendor-portal" { $EmojiVendorPortal }
        "mobile-app" { $EmojiMobileApp }
        default { $EmojiRocket }
    }
    
    Write-Host "`n$emoji $AppName is running at: http://localhost:$Port" -ForegroundColor Green
}

function Invoke-HealthCheck {
    Write-Section "HEALTH CHECKS"
    
    # Import service endpoints configuration
    . "$PSScriptRoot/service-endpoints.ps1"
    
    # Load environment variables
    $envVars = Get-EnvVariables
    # Get service endpoints
    $serviceEndpoints = Get-ServiceEndpoints -EnvVars $envVars
    
    # Perform health checks using GetEnumerator()
    foreach ($check in $serviceEndpoints.GetEnumerator()) {
        $serviceName = $check.Key -replace "-", " " | ForEach-Object { (Get-Culture).TextInfo.ToTitleCase($_.ToLower()) }
        $result = Test-ServiceHealth -ServiceName $check.Key -Url $check.Value
        
        if ($result.Success) {
            Write-Status "${EmojiCheckMark} ${serviceName}: Healthy" "SUCCESS"
        } else {
            Write-Status "${EmojiCrossMark} ${serviceName}: Unhealthy ($($result.Message))" "ERROR"
        }
    }
    
    # Check frontend applications
    Write-Host "`nFRONTEND STATUS:" -ForegroundColor Yellow
    foreach ($app in $Global:FrontendProcesses) {
        if ($app.Process -and !$app.Process.HasExited) {
            Write-Status "${EmojiCheckMark} $($app.Name): Running (PID: $($app.Process.Id))" "SUCCESS"
        } else {
            Write-Status "${EmojiCrossMark} $($app.Name): Not running" "ERROR"
        }
    }
}

function Start-EnhancedHealthMonitoring {
    Write-Status "$EmojiHospital Starting enhanced health check monitoring..." "INFO"
    
    $healthCheckJob = Start-Job -ScriptBlock {
        param($ScriptRoot)
        
        # Function to run health check and report failures quickly
        function Invoke-HealthCheckWithQuickFail {
            try {
                # Capture health check output
                $healthOutput = & "$ScriptRoot/health-check-services.ps1" 2>&1
                
                # Check for failure indicators in output
                $failureLines = $healthOutput | Where-Object { $_ -match "❌|Health check failed|No services running" }
                
                if ($failureLines) {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ${EmojiCrossMark} HEALTH CHECK ALERTS:" -ForegroundColor Red
                    foreach ($line in $failureLines) {
                        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $EmojiCrossMark $line" -ForegroundColor Red
                    }
                }
                
                # Also check container status directly for quicker detection
                $unhealthyContainers = docker ps --filter "health=unhealthy" --format "{{.Names}} ({{.Status}})" 2>$null
                if ($unhealthyContainers) {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ${EmojiCrossMark} UNHEALTHY CONTAINERS DETECTED:" -ForegroundColor Red
                    $unhealthyContainers | ForEach-Object {
                        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ${EmojiCrossMark} Container: $_" -ForegroundColor Red
                    }
                }
                
            } catch {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ${EmojiCrossMark} Health check script error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Run health checks every 15 seconds for quicker failure detection
        while ($true) {
            Invoke-HealthCheckWithQuickFail
            Start-Sleep -Seconds 15
        }
    } -ArgumentList $PSScriptRoot
    
    Write-Status "$EmojiCheckMark Enhanced health check monitoring started (15s interval)" "SUCCESS"
    return $healthCheckJob
}

function Show-ServiceStatus {
    Write-Section "SERVICE STATUS"
    
    # Docker services status
    Write-Host "BACKEND SERVICES:" -ForegroundColor Yellow
    try {
        $services = docker compose -f infrastructure/docker-compose.dev.yml ps --format json | ConvertFrom-Json
        if ($services) {
            foreach ($service in $services) {
                $status = if ($service.State -eq "running") { $EmojiCheckMark } else { $EmojiCrossMark }
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
                Write-Status "${EmojiCheckMark} $($app.Name): Running (PID: $($app.Process.Id))" "SUCCESS"
            } else {
                Write-Status "${EmojiCrossMark} $($app.Name): Not running" "ERROR"
            }
        }
    } else {
        Write-Status "  No frontend services running" "WARNING"
    }
}

function Stop-AllServices {
    Write-Section "STOPPING ALL SERVICES"
    
    # Stop enhanced health check job
    if ($healthCheckJob) {
        Write-Status "Stopping enhanced health monitoring..." "INFO"
        try {
            Stop-Job -Job $healthCheckJob -ErrorAction SilentlyContinue
            Remove-Job -Job $healthCheckJob -ErrorAction SilentlyContinue
            Write-Status "Enhanced health monitoring stopped" "SUCCESS"
        } catch {
            Write-Status "Error stopping health monitoring: $($_.Exception.Message)" "WARNING"
        }
    }
    
    # Stop frontend processes
    if ($Global:FrontendProcesses.Count -gt 0) {
        Write-Status "Stopping frontend applications..." "INFO"
        foreach ($app in $Global:FrontendProcesses) {
            if ($app.Process -and !$app.Process.HasExited) {
                try {
                    # Try graceful shutdown first (important for terminal hosts like wt.exe with multiple tabs)
                    $app.Process.CloseMainWindow()
                    Start-Sleep -Milliseconds 500
                    
                    # If process hasn't exited, force termination as fallback
                    if (!$app.Process.HasExited) {
                        Stop-Process -Id $app.Process.Id -Force
                    }
                    
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
        docker compose -f infrastructure/docker-compose.dev.yml down --volumes
        if (Test-Path "infrastructure/docker-compose.monitoring.yml") {
            docker compose -f infrastructure/docker-compose.monitoring.yml down --volumes
        }
        Write-Status "Backend services stopped" "SUCCESS"
    } catch {
        Write-Status "Error stopping backend services: $($_.Exception.Message)" "ERROR"
    }
    
    # Clean up any remaining background jobs
    try {
        Get-Job | Where-Object { $_.State -eq 'Running' } | Stop-Job -ErrorAction SilentlyContinue
        Get-Job | Remove-Job -ErrorAction SilentlyContinue
    } catch {
        # Ignore cleanup errors
    }
    
    Write-Status "All services stopped" "SUCCESS"
}

function Register-ShutdownHandler {
    # Register Ctrl+C handler
    try {
        [console]::TreatControlCAsInput = $false
    } catch {
        # Handle invalid console context (e.g., when running in non-interactive mode)
        Write-Status "Console control registration skipped (non-interactive mode)" "WARNING"
    }
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

# Start enhanced health monitoring if we're starting services
$healthCheckJob = $null
if ($startBackend -or $startFrontend -or $startSpecific) {
    $healthCheckJob = Start-EnhancedHealthMonitoring
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

# Function to show login credentials
function Show-LoginCredentials {
    $credentials = @(
        [PSCustomObject]@{Service='PostgreSQL (Main)'; URL='localhost:5432'; Username='ecomarket'; Password='ecomarket_secure_password_2024'},
        [PSCustomObject]@{Service='PostgreSQL (Orders)'; URL='localhost:5434'; Username='orders_user'; Password='orders_password'},
        [PSCustomObject]@{Service='MongoDB'; URL='localhost:27017'; Username='eco'; Password='eco_pass'},
        [PSCustomObject]@{Service='Redis (Main)'; URL='localhost:6379'; Username='N/A'; Password='N/A'},
        [PSCustomObject]@{Service='Redis (Orders)'; URL='localhost:6380'; Username='N/A'; Password='N/A'},
        [PSCustomObject]@{Service='pgAdmin'; URL='http://localhost:8080'; Username='admin@ecomarket.dev'; Password='admin'},
        [PSCustomObject]@{Service='Redis Commander'; URL='http://localhost:8082'; Username='N/A'; Password='N/A'}
    )
    
    Write-Host ""
    Write-Host "" + ("=" * 130) -ForegroundColor Cyan
    Write-Host "  LOGIN CREDENTIALS" -ForegroundColor Yellow -BackgroundColor DarkBlue
    Write-Host "" + ("=" * 130) -ForegroundColor Cyan
    
    $formatString = "  {0,-20} {1,-25} {2,-25} {3,-30}"
    Write-Host ($formatString -f 'SERVICE', 'URL', 'USERNAME', 'PASSWORD') -ForegroundColor Yellow
    Write-Host "" + ("-" * 130) -ForegroundColor Gray
    
    foreach ($cred in $credentials) {
        Write-Host ($formatString -f $cred.Service, $cred.URL, $cred.Username, $cred.Password) -ForegroundColor Green
    }
    Write-Host "" + ("=" * 130) -ForegroundColor Cyan
}

# Show final status
Write-Section "DEVELOPMENT ENVIRONMENT READY"

if ($startBackend) {
    Write-Host "BACKEND SERVICES:" -ForegroundColor Yellow
    Write-Host "${EmojiWrench} Product Catalog:    http://localhost:8000" -ForegroundColor Cyan
    Write-Host "${EmojiPerson} User Service:       http://localhost:8001" -ForegroundColor Cyan
    Write-Host "${EmojiCreditCard} Payment Service:    http://localhost:7000" -ForegroundColor Cyan
    Write-Host "${EmojiPackage} Order Service:      http://localhost:8003" -ForegroundColor Cyan
    Write-Host "${EmojiBarChart} Inventory Service:  http://localhost:8005" -ForegroundColor Cyan
    Write-Host "${EmojiTrendingUp} Analytics Service:  http://localhost:9000" -ForegroundColor Cyan
    Write-Host "$EmojiBell Notification:       http://localhost:9001" -ForegroundColor Cyan
    Write-Host "$EmojiFileCabinet pgAdmin:            http://localhost:8080 (admin@ecomarket.dev / admin)" -ForegroundColor Cyan
    Write-Host "$EmojiWrench Redis Commander:    http://localhost:8082" -ForegroundColor Cyan
    
    if ($Monitoring) {
        Write-Host "$EmojiBarChart Grafana:            http://localhost:3000 (admin / admin)" -ForegroundColor Cyan
        Write-Host "$EmojiTarget Prometheus:         http://localhost:9090" -ForegroundColor Cyan
    }
}

if ($startFrontend -or $startSpecific) {
    Show-FrontendUrls
}

Show-LoginCredentials

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
