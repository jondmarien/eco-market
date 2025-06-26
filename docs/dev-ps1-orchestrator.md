# EcoMarket Development Environment Orchestrator Guide (dev.ps1)

## Table of Contents
- [Script Purpose and Architecture](#script-purpose-and-architecture)
- [Switch Parameters Reference](#switch-parameters-reference)
- [Set-StrictMode Compliance](#set-strictmode-compliance)
- [Internal Architecture](#internal-architecture)
- [Extending the Script](#extending-the-script)
- [Troubleshooting](#troubleshooting)

## Script Purpose and Architecture

The `dev.ps1` script is the comprehensive development environment orchestrator for EcoMarket, providing unified control over:

- **Backend Services**: Docker Compose-based microservices infrastructure including databases (PostgreSQL, MongoDB, Redis), APIs (user-service, product-catalog, order-service, payment-service, inventory-service, analytics-service, notification-service)
- **Frontend Applications**: Next.js customer web app, React admin dashboard, React vendor portal, Expo mobile app
- **Development Tools**: Health monitoring, logging, service status checking, graceful shutdown
- **Cross-Platform Support**: Windows, macOS, and Linux compatibility

### Key Features

- **Unified Control**: Single script manages entire development stack
- **Modular Services**: Start individual components or full stack
- **Health Monitoring**: Continuous health checks with 15-second intervals
- **Unicode Support**: Emoji-based status indicators with ASCII fallback
- **Environment Management**: .env file loading and validation
- **Port Management**: Automatic port conflict detection and resolution
- **Process Management**: PID tracking and graceful shutdown
- **Logging**: Timestamped, color-coded output with service prefixes

## Switch Parameters Reference

### Primary Modes

| Parameter | Description | Use Case | Example |
|-----------|-------------|----------|---------|
| `-FullStack` | Start complete development environment (backend + frontend) | Complete development setup | `./dev.ps1 -FullStack` |
| `-Backend` | Start only backend services (Docker Compose infrastructure) | API development and testing | `./dev.ps1 -Backend` |
| `-Frontend` | Start all frontend applications | Frontend-focused development | `./dev.ps1 -Frontend` |

### Individual Frontend Services

| Parameter | Service | Technology | Port | Example |
|-----------|---------|------------|------|---------|
| `-CustomerWeb` | Customer-facing web application | Next.js | 3000 | `./dev.ps1 -CustomerWeb` |
| `-AdminDashboard` | Admin management interface | React CRA | 3001 | `./dev.ps1 -AdminDashboard` |
| `-VendorPortal` | Vendor management portal | React CRA | 3002 | `./dev.ps1 -VendorPortal` |
| `-MobileApp` | Mobile application | Expo | 19006 | `./dev.ps1 -MobileApp` |

### Utility Commands

| Parameter | Description | Output | Example |
|-----------|-------------|--------|---------|
| `-Monitoring` | Include monitoring stack (Prometheus, Grafana) | Adds monitoring services | `./dev.ps1 -Backend -Monitoring` |
| `-HealthCheck` | Run health checks on all services | Service health status | `./dev.ps1 -HealthCheck` |
| `-Status` | Show status of all services | Current service states | `./dev.ps1 -Status` |
| `-Stop` | Stop all development services | Graceful shutdown | `./dev.ps1 -Stop` |
| `-Help` | Show detailed help information | Usage guide | `./dev.ps1 -Help` |

### Common Usage Patterns

```powershell
# Full development environment
./dev.ps1 -FullStack

# Backend with monitoring for infrastructure work
./dev.ps1 -Backend -Monitoring

# Just customer web app for frontend development
./dev.ps1 -CustomerWeb

# All frontend apps for multi-app testing
./dev.ps1 -Frontend

# Check system health
./dev.ps1 -HealthCheck

# Clean shutdown
./dev.ps1 -Stop
```

## Set-StrictMode Compliance

### The Problem
PowerShell's `Set-StrictMode -Version Latest` enforces strict variable initialization, preventing the use of uninitialized variables. Switch parameters in PowerShell functions can be undefined if not explicitly passed, causing strict mode violations.

### The Solution
Lines 751-762 in `dev.ps1` implement explicit variable initialization:

```powershell
# Initialize switch parameters to ensure they exist (Set-StrictMode compatibility)
if (-not (Get-Variable -Name 'Backend' -ErrorAction SilentlyContinue)) { $Backend = $false }
if (-not (Get-Variable -Name 'Frontend' -ErrorAction SilentlyContinue)) { $Frontend = $false }
if (-not (Get-Variable -Name 'FullStack' -ErrorAction SilentlyContinue)) { $FullStack = $false }
if (-not (Get-Variable -Name 'CustomerWeb' -ErrorAction SilentlyContinue)) { $CustomerWeb = $false }
if (-not (Get-Variable -Name 'AdminDashboard' -ErrorAction SilentlyContinue)) { $AdminDashboard = $false }
if (-not (Get-Variable -Name 'VendorPortal' -ErrorAction SilentlyContinue)) { $VendorPortal = $false }
if (-not (Get-Variable -Name 'MobileApp' -ErrorAction SilentlyContinue)) { $MobileApp = $false }
if (-not (Get-Variable -Name 'Monitoring' -ErrorAction SilentlyContinue)) { $Monitoring = $false }
if (-not (Get-Variable -Name 'HealthCheck' -ErrorAction SilentlyContinue)) { $HealthCheck = $false }
if (-not (Get-Variable -Name 'Stop' -ErrorAction SilentlyContinue)) { $Stop = $false }
if (-not (Get-Variable -Name 'Status' -ErrorAction SilentlyContinue)) { $Status = $false }
if (-not (Get-Variable -Name 'Help' -ErrorAction SilentlyContinue)) { $Help = $false }
```

### Benefits
- **Robust Error Checking**: Prevents uninitialized variable usage
- **Predictable Behavior**: All switch variables have defined states
- **Code Quality**: Enforces best practices and reduces bugs
- **Compatibility**: Works across different PowerShell execution policies

## Internal Architecture

### Docker Compose File Resolution

#### Dynamic Compose File Selection
The script dynamically builds Docker Compose commands based on parameters:

```powershell
function Start-BackendServices {
    param([bool]$IncludeMonitoring = $false)
    
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
}
```

#### Compose File Structure
- **Primary**: `infrastructure/docker-compose.dev.yml` - Core services
- **Monitoring**: `infrastructure/docker-compose.monitoring.yml` - Prometheus/Grafana stack

### Frontend Process Spawning

#### Cross-Platform Terminal Management
The script spawns frontend applications in separate terminal windows for better development experience:

**Windows Implementation:**
```powershell
if ($IsWindows) {
    # Build environment variable commands for PowerShell
    $envCommands = ""
    foreach ($envVar in $EnvVars.GetEnumerator()) {
        $envCommands += "[Environment]::SetEnvironmentVariable('$($envVar.Key)', '$($envVar.Value)', 'Process'); "
    }
    
    # Use regular PowerShell windows instead of Windows Terminal to avoid complexity
    $command = "Set-Location '$AbsoluteDirectory'; $envCommands npm run $Command"
    $proc = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $command) -PassThru
}
```

**macOS Implementation:**
```powershell
if ($IsMacOS) {
    # macOS: Use osascript to open new Terminal tab
    $script = "tell application `"Terminal`" to do script `"cd '$AbsoluteDirectory' && npm run $Command'`""
    $proc = Start-Process -FilePath 'osascript' -ArgumentList @('-e', $script) -PassThru
}
```

**Linux Implementation:**
```powershell
if ($IsLinux) {
    # Linux: Try common terminal emulators
    $terminals = @('gnome-terminal', 'xterm', 'konsole', 'xfce4-terminal')
    # ... fallback logic for different terminal emulators
}
```

#### Process Configuration
Frontend applications are defined with specific configurations:

```powershell
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
    }
    # ... additional apps
)
```

### Cross-Platform Notes

#### Unicode Support
The script includes comprehensive Unicode handling:

```powershell
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
```

#### Platform Detection
- `$IsWindows` - Windows-specific logic
- `$IsMacOS` - macOS-specific logic  
- `$IsLinux` - Linux-specific logic

### Logging & PID Management

#### Custom Logging Functions

```powershell
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
```

#### Process Tracking
Frontend processes are tracked in a global array:

```powershell
$Global:FrontendProcesses = @()

# Process registration
$Global:FrontendProcesses += @{
    Name = $AppName
    Process = $process
    Port = $Port
}
```

#### Emoji Status Indicators
The script uses Unicode emojis with ASCII fallbacks:

```powershell
$EmojiCheckMark = if ($UseUnicode) { "✅" } else { "[OK]" }
$EmojiCrossMark = if ($UseUnicode) { "❌" } else { "[FAIL]" }
$EmojiWarning = if ($UseUnicode) { "⚠️" } else { "[WARN]" }
```

### Graceful Shutdown

#### Shutdown Handler Registration
```powershell
function Register-ShutdownHandler {
    # Register Ctrl+C handler
    try {
        [console]::TreatControlCAsInput = $false
    } catch {
        Write-Status "Console control registration skipped (non-interactive mode)" "WARNING"
    }
    $null = Register-EngineEvent PowerShell.Exiting -Action {
        Write-Host "`nShutting down..." -ForegroundColor Yellow
        Stop-AllServices
    }
}
```

#### Multi-Phase Shutdown Process
1. **Health Monitoring**: Stop background health check jobs
2. **Frontend Processes**: Graceful window closure, then force termination
3. **Docker Services**: `docker compose down --volumes`
4. **Background Jobs**: Clean up PowerShell jobs
5. **Resource Cleanup**: Free ports and remove temporary files

### Health Monitoring System

#### Service Endpoint Configuration
Health checks use centralized endpoint configuration from `service-endpoints.ps1`:

```powershell
$serviceEndpoints = @{
    "user-service"        = "http://localhost:8001/api/v1/health"
    "payment-service"     = "http://localhost:7000/api/v1/health"
    "order-service"       = "http://localhost:8003/api/v1/health"
    "product-catalog"     = "http://localhost:8000/docs"
    "inventory-service"   = "http://localhost:8005/api/v1/health"
    "analytics-service"   = "http://localhost:9000/health/"
    "notification-service"= "http://localhost:9001/api/v1/health"
}
```

#### Enhanced Health Monitoring
Continuous monitoring with 15-second intervals:

```powershell
function Start-EnhancedHealthMonitoring {
    $healthCheckJob = Start-Job -ScriptBlock {
        while ($true) {
            Invoke-HealthCheckWithQuickFail
            Start-Sleep -Seconds 15
        }
    }
}
```

## Extending the Script

### Adding New Backend Services

1. **Update Docker Compose**: Add service definition to `infrastructure/docker-compose.dev.yml`
2. **Service Endpoints**: Add health check endpoint to `scripts/service-endpoints.ps1`
3. **Environment Variables**: Add any required environment variables to `.env.template`

### Adding New Frontend Applications

1. **Add Switch Parameter**: 
```powershell
Param(
    # ... existing parameters
    [switch]$NewApp
)
```

2. **Initialize Variable** (Set-StrictMode compliance):
```powershell
if (-not (Get-Variable -Name 'NewApp' -ErrorAction SilentlyContinue)) { $NewApp = $false }
```

3. **Add Configuration**:
```powershell
$appConfigs = @{
    # ... existing configs
    "new-app" = @{
        Directory = "path/to/new-app"
        Command = "dev"
        Port = 3003
    }
}
```

4. **Add to Frontend Apps Array**:
```powershell
$frontendApps = @(
    # ... existing apps
    @{
        Name = "new-app"
        Directory = "path/to/new-app"
        Command = "dev"
        Port = 3003
    }
)
```

5. **Add Conditional Logic**:
```powershell
if ($NewApp) { Start-SpecificFrontend "new-app" }
```

6. **Update Help Documentation**:
```powershell
function Show-Help {
    Write-Host @"
# ... existing help
    -NewApp                     Start new application
"@
}
```

### Adding New Monitoring Features

1. **Health Check Functions**: Add service-specific health check logic
2. **Logging Enhancements**: Add new log categories or formats
3. **Status Reporting**: Extend status display functions

### Best Practices for Extensions

- **Consistent Naming**: Follow existing naming conventions
- **Error Handling**: Include try-catch blocks for robust error handling
- **Cross-Platform**: Test additions on Windows, macOS, and Linux
- **Documentation**: Update help text and comments
- **Environment Variables**: Use .env file for configuration
- **Port Management**: Check for port conflicts
- **Graceful Degradation**: Handle missing dependencies gracefully

## Troubleshooting

### Common Issues

#### Port Conflicts
**Symptoms**: "Port already in use" errors
**Solutions**:
```powershell
# Check port usage
netstat -an | findstr :3000

# Force cleanup
./dev.ps1 -Stop

# Check specific port
Test-NetConnection -ComputerName localhost -Port 3000
```

#### Docker Issues
**Symptoms**: Container startup failures
**Solutions**:
```powershell
# Check Docker status
docker --version
docker compose version

# View container logs
docker logs ecomarket-postgres

# Health check
./dev.ps1 -HealthCheck
```

#### Frontend Process Issues
**Symptoms**: Frontend apps not starting
**Solutions**:
```powershell
# Check Node.js version
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Manual start for debugging
cd frontend/customer-web
npm install
npm run dev
```

#### PowerShell Execution Policy
**Symptoms**: Script execution blocked
**Solutions**:
```powershell
# Check current policy
Get-ExecutionPolicy

# Set appropriate policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Debug Mode
For detailed debugging, you can modify the script to include verbose output:

```powershell
# Add at the top of the script
$VerbosePreference = "Continue"
$DebugPreference = "Continue"
```

### Log Analysis
Logs are stored in the `logs/` directory with timestamps and service prefixes. Use these for troubleshooting specific service issues.

---

*This guide provides comprehensive coverage of the dev.ps1 orchestrator script. For additional support, refer to the main [Development Environment Setup](dev-environment.md) documentation or create an issue in the project repository.*
