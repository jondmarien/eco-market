Param(
    [string[]]$ComposeFiles = @(),
    [string]$EnvFile = "../.env",
    [string]$Services = "",
    [switch]$Monitoring,
    [switch]$AllServices,
    [switch]$ProductCatalog,
    [switch]$OrderService,
    [switch]$InventoryService,
    [switch]$Help
)

function Show-Help {
    Write-Host @"
EcoMarket Development Environment Startup Script

USAGE:
    .\up.ps1 [OPTIONS]

OPTIONS:
    -ComposeFiles <string[]>     Explicit list of compose files to use
    -EnvFile <string>           Environment file path (default: ../.env)
    -Services <string>          Specific services to start (comma-separated)
    -Monitoring                 Include monitoring stack
    -AllServices                Start all available services
    -ProductCatalog             Start only Product Catalog service and dependencies
    -OrderService               Start only Order service and dependencies
    -InventoryService           Start only Inventory service and dependencies
    -Help                       Show this help message

EXAMPLES:
    # Start all services (requires docker-compose.dev.yml)
    .\up.ps1 -AllServices

    # Start specific services using individual compose files
    .\up.ps1 -ProductCatalog

    # Start with monitoring
    .\up.ps1 -AllServices -Monitoring

    # Use explicit compose files
    .\up.ps1 -ComposeFiles @("../product-catalog-service/docker-compose.yml", "../services/order-service/docker-compose.yml")

    # Start specific services from all-in-one compose
    .\up.ps1 -ComposeFiles @("../infrastructure/docker-compose.dev.yml") -Services "postgres-catalog,redis-catalog,product-catalog"

COMPOSE FILE PRIORITY:
    1. Explicit -ComposeFiles parameter
    2. Service-specific flags (builds list automatically)
    3. Default: ../infrastructure/docker-compose.dev.yml

"@
}

if ($Help) {
    Show-Help
    exit 0
}

# Build compose files list based on flags
if ($ComposeFiles.Count -eq 0) {
    if ($ProductCatalog) {
        $ComposeFiles += "../product-catalog-service/docker-compose.yml"
    }
    if ($OrderService) {
        $ComposeFiles += "../services/order-service/docker-compose.yml"
    }
    if ($InventoryService) {
        $ComposeFiles += "../inventory-service/docker-compose.yml"
    }
    if ($Monitoring) {
        $ComposeFiles += "../infrastructure/docker-compose.monitoring.yml"
    }
    if ($AllServices -or $ComposeFiles.Count -eq 0) {
        # Default to main dev compose file
        $ComposeFiles = @("../infrastructure/docker-compose.dev.yml")
        if ($Monitoring) {
            $ComposeFiles += "../infrastructure/docker-compose.monitoring.yml"
        }
    }
}

# Validate compose files exist
$MissingFiles = @()
foreach ($file in $ComposeFiles) {
    if (-not (Test-Path $file)) {
        $MissingFiles += $file
    }
}

if ($MissingFiles.Count -gt 0) {
    Write-Host "ERROR: The following compose files are missing:" -ForegroundColor Red
    foreach ($file in $MissingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "SOLUTIONS:" -ForegroundColor Yellow
    Write-Host "1. Create the missing docker-compose.dev.yml file (see docs/DOCKER_COMPOSE_RESOLUTION_GUIDE.md)" -ForegroundColor Yellow
    Write-Host "2. Use individual service compose files with flags like -ProductCatalog, -OrderService" -ForegroundColor Yellow
    Write-Host "3. Use -ComposeFiles with existing compose file paths" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run '.\up.ps1 -Help' for more information" -ForegroundColor Cyan
    exit 1
}

# Build docker compose command
$DockerComposeCmd = "docker compose --env-file `"$EnvFile`""

foreach ($file in $ComposeFiles) {
    $DockerComposeCmd += " -f `"$file`""
}

$DockerComposeCmd += " up -d --build"

if ($Services) {
    $DockerComposeCmd += " $Services"
}

Write-Host "Starting EcoMarket development environment..." -ForegroundColor Green
Write-Host "Compose files: $($ComposeFiles -join ', ')" -ForegroundColor Cyan
Write-Host "Environment file: $EnvFile" -ForegroundColor Cyan

if ($Services) {
    Write-Host "Services: $Services" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Executing: $DockerComposeCmd" -ForegroundColor Gray
Invoke-Expression $DockerComposeCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Development environment started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "AVAILABLE SERVICES:" -ForegroundColor Yellow
    Write-Host "🌐 Product Catalog API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📦 Order Service API: http://localhost:8003" -ForegroundColor Cyan
    Write-Host "📊 Inventory Service API: http://localhost:8002" -ForegroundColor Cyan
    Write-Host "🗃️  pgAdmin: http://localhost:8080 (admin@ecomarket.dev / admin)" -ForegroundColor Cyan
    Write-Host "🔧 Redis Commander: http://localhost:8081" -ForegroundColor Cyan
    if ($Monitoring) {
        Write-Host "📈 Grafana: http://localhost:3000 (admin / admin)" -ForegroundColor Cyan
        Write-Host "🎯 Prometheus: http://localhost:9090" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "To stop: docker compose down" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Failed to start development environment" -ForegroundColor Red
    Write-Host "Check the output above for error details" -ForegroundColor Red
}
