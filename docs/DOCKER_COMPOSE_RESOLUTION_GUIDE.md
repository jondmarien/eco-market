# Docker Compose Development Setup Resolution Guide

This guide provides two solutions to resolve the missing `docker-compose.dev.yml` file issue that prevents the development environment from starting properly.

## Problem Context

The `scripts/up.ps1` script currently references `../infrastructure/docker-compose.dev.yml` which doesn't exist, causing the development environment startup to fail.

---

## Solution A: Create Root Infrastructure docker-compose.dev.yml

### Overview
Create a centralized development Docker Compose file that orchestrates all services for local development.

### Implementation

Create the file `infrastructure/docker-compose.dev.yml` with the following content:

```yaml
version: '3.8'

services:
  # ===== DATABASES =====
  # PostgreSQL for Product Catalog
  postgres-catalog:
    image: postgres:15-alpine
    container_name: ecomarket-catalog-db
    environment:
      POSTGRES_DB: product_catalog
      POSTGRES_USER: ecomarket
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - catalog_postgres_data:/var/lib/postgresql/data
      - ../product-catalog-service/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecomarket -d product_catalog"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ecomarket-dev

  # PostgreSQL for Orders
  postgres-orders:
    image: postgres:15-alpine
    container_name: ecomarket-orders-db
    environment:
      POSTGRES_DB: orders_db
      POSTGRES_USER: orders_user
      POSTGRES_PASSWORD: orders_password
    ports:
      - "5434:5432"
    volumes:
      - orders_postgres_data:/var/lib/postgresql/data
      - ../services/order-service/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U orders_user -d orders_db"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ecomarket-dev

  # PostgreSQL for Inventory
  postgres-inventory:
    image: postgres:15-alpine
    container_name: ecomarket-inventory-db
    environment:
      POSTGRES_DB: inventory_db
      POSTGRES_USER: inventory_user
      POSTGRES_PASSWORD: inventory_password
    ports:
      - "5435:5432"
    volumes:
      - inventory_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U inventory_user -d inventory_db"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ecomarket-dev

  # ===== REDIS INSTANCES =====
  # Redis for Product Catalog
  redis-catalog:
    image: redis:7-alpine
    container_name: ecomarket-catalog-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - catalog_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ecomarket-dev

  # Redis for Orders
  redis-orders:
    image: redis:7-alpine
    container_name: ecomarket-orders-redis
    ports:
      - "6380:6379"
    command: redis-server --appendonly yes
    volumes:
      - orders_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ecomarket-dev

  # ===== APPLICATION SERVICES =====
  # Product Catalog Service
  product-catalog:
    build: ../product-catalog-service
    container_name: ecomarket-product-catalog
    ports:
      - "8000:8000"
    environment:
      POSTGRES_SERVER: postgres-catalog
      POSTGRES_PORT: 5432
      POSTGRES_DB: product_catalog
      POSTGRES_USER: ecomarket
      POSTGRES_PASSWORD: password
      REDIS_URL: redis://redis-catalog:6379
      ENVIRONMENT: development
    depends_on:
      postgres-catalog:
        condition: service_healthy
      redis-catalog:
        condition: service_healthy
    volumes:
      - ../product-catalog-service/app:/app/app
    restart: unless-stopped
    networks:
      - ecomarket-dev

  # Order Service
  order-service:
    build: ../services/order-service
    container_name: ecomarket-order-service
    ports:
      - "8003:8080"
    environment:
      PORT: 8080
      POSTGRESQL_URL: postgres://orders_user:orders_password@postgres-orders:5432/orders_db?sslmode=disable
      REDIS_URL: redis://redis-orders:6379
      ENVIRONMENT: development
    depends_on:
      postgres-orders:
        condition: service_healthy
      redis-orders:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - ecomarket-dev

  # Inventory Service
  inventory-service:
    build: ../inventory-service
    container_name: ecomarket-inventory-service
    ports:
      - "8002:8080"
    environment:
      PORT: 8080
      POSTGRESQL_URL: postgres://inventory_user:inventory_password@postgres-inventory:5432/inventory_db?sslmode=disable
      ENVIRONMENT: development
    depends_on:
      postgres-inventory:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - ecomarket-dev

  # ===== UTILITY SERVICES =====
  # Redis Commander for debugging
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: ecomarket-redis-commander
    environment:
      REDIS_HOSTS: |
        catalog:redis-catalog:6379,
        orders:redis-orders:6379
    ports:
      - "8081:8081"
    networks:
      - ecomarket-dev
    depends_on:
      - redis-catalog
      - redis-orders

  # pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ecomarket-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ecomarket.dev
      PGADMIN_DEFAULT_PASSWORD: admin
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "8080:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - ecomarket-dev
    depends_on:
      - postgres-catalog
      - postgres-orders
      - postgres-inventory

volumes:
  catalog_postgres_data:
  orders_postgres_data:
  inventory_postgres_data:
  catalog_redis_data:
  orders_redis_data:
  pgadmin_data:

networks:
  ecomarket-dev:
    driver: bridge
    name: ecomarket-development
```

### Benefits of Solution A
- ✅ Single command starts entire development environment
- ✅ Centralized configuration management
- ✅ Consistent networking between services
- ✅ Easy to add new services
- ✅ Built-in utility services (pgAdmin, Redis Commander)

### Drawbacks of Solution A
- ❌ Large monolithic file
- ❌ Rebuilds all services even for single service changes
- ❌ Harder to work on individual services in isolation

---

## Solution B: Explicit Compose Files and Per-Service Support

### Overview
Enhance the startup script to support multiple compose file strategies and provide flexibility for different development workflows.

### Implementation

#### Updated scripts/up.ps1

```powershell
Param(
    [string[]]$ComposeFiles = @(),
    [string]$EnvFile = "..\.env",
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
    -EnvFile <string>           Environment file path (default: ..\.env)
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
```

#### Service-Specific Quick Start Scripts

Create these additional convenience scripts:

**scripts/start-catalog.ps1**
```powershell
# Quick start for Product Catalog service only
.\up.ps1 -ProductCatalog
```

**scripts/start-orders.ps1**
```powershell
# Quick start for Order service only
.\up.ps1 -OrderService
```

**scripts/start-inventory.ps1**
```powershell
# Quick start for Inventory service only
.\up.ps1 -InventoryService
```

**scripts/start-all.ps1**
```powershell
# Start all services with monitoring
.\up.ps1 -AllServices -Monitoring
```

### Benefits of Solution B
- ✅ Flexible development workflows
- ✅ Can work with existing individual compose files
- ✅ Supports partial environment startup
- ✅ Clear error messages with solutions
- ✅ Backward compatible with existing individual service compose files

### Drawbacks of Solution B
- ❌ More complex script logic
- ❌ Requires managing multiple compose files
- ❌ Potential networking issues between separately managed services

---

## Recommendation

**For most development teams: Use Solution A**

Solution A provides a better developer experience with a single command to start the entire environment. It's easier to maintain and ensures consistent networking between services.

**For teams needing service isolation: Use Solution B**

Solution B is better for larger teams where developers work on individual services and need the ability to start only specific parts of the system.

## Next Steps

1. **Choose your preferred solution** based on your team's development workflow
2. **Implement the chosen solution** using the provided code examples
3. **Test the setup** by running `.\scripts\up.ps1` with appropriate flags
4. **Update team documentation** to reflect the new startup procedures
5. **Consider creating both solutions** for maximum flexibility

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure no other services are running on the required ports
2. **Docker not running**: Make sure Docker Desktop is started
3. **Permission issues**: Run PowerShell as Administrator if needed
4. **Path issues**: Ensure all relative paths in compose files are correct
5. **Environment variables**: Verify `.env` file exists and contains required variables

### Health Checks

All database services include health checks. If a service fails to start, check:
- Database initialization logs
- Network connectivity between services
- Environment variable configuration
- Volume mount permissions
