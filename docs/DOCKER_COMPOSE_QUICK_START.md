# Docker Compose Quick Start Guide

## Overview
The EcoMarket development environment now supports flexible startup options to accommodate different development workflows.

## Quick Commands

### Start Everything (Recommended for new developers)
```powershell
cd scripts
.\up.ps1 -AllServices
```

### Start Individual Services
```powershell
# Product Catalog only
.\start-catalog.ps1

# Order Service only
.\start-orders.ps1

# Inventory Service only  
.\start-inventory.ps1

# All services with monitoring
.\start-all.ps1
```

### Custom Compose Files
```powershell
# Use specific compose files
.\up.ps1 -ComposeFiles @("../product-catalog-service/docker-compose.yml", "../services/order-service/docker-compose.yml")

# Start specific services from main compose
.\up.ps1 -Services "postgres,redis,product-catalog-service"
```

## Available Services After Startup

| Service | URL | Description |
|---------|-----|-------------|
| Kong API Gateway | http://localhost:8000 | Main API proxy |
| Kong Admin | http://localhost:8001 | API Gateway management |
| Product Catalog | http://localhost:${PRODUCT_SERVICE_PORT} | Product management |
| Order Service | http://localhost:${ORDER_SERVICE_PORT} | Order processing |
| User Service | http://localhost:${USER_SERVICE_PORT} | User management |
| Payment Service | http://localhost:7000 | Payment processing |
| Inventory Service | http://localhost:8005 | Inventory management |
| Analytics Service | http://localhost:9000 | Analytics and reporting |
| Notification Service | http://localhost:9001 | Push notifications |
| PostgreSQL | localhost:5432 | Primary database |
| Redis | localhost:6379 | Caching layer |
| MongoDB | localhost:27017 | Analytics database |

## Environment Variables
Make sure your `.env` file contains all required variables. Check `.env.template` for the complete list.

## Troubleshooting

### Error: Missing compose files
```
ERROR: The following compose files are missing:
  - ../infrastructure/docker-compose.dev.yml
```

**Solutions:**
1. The file exists at `infrastructure/docker-compose.dev.yml` - check your working directory
2. Use individual service flags: `.\up.ps1 -ProductCatalog -OrderService`
3. Run `.\up.ps1 -Help` for more options

### Port conflicts
If you see port binding errors:
1. Check what's running: `netstat -an | findstr :8000`
2. Stop conflicting services or change ports in `.env`
3. Use `docker ps` to see running containers

### Service won't start
1. Check Docker Desktop is running
2. Verify `.env` file exists and has correct values
3. Check logs: `docker compose logs [service-name]`
4. Restart with: `docker compose down && .\up.ps1 -AllServices`

## Getting Help
```powershell
# Show all available options
.\up.ps1 -Help

# Check service status
docker compose ps

# View logs
docker compose logs -f [service-name]

# Stop everything
docker compose down
```

For detailed information about both solution approaches, see [DOCKER_COMPOSE_RESOLUTION_GUIDE.md](./DOCKER_COMPOSE_RESOLUTION_GUIDE.md).
