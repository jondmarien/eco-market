# Running the Full Stack

This guide provides step-by-step instructions for running the complete EcoMarket application stack using Docker.

## Prerequisites

1. **Docker Desktop**: Ensure Docker Desktop is installed and running on your system
2. **PowerShell**: For Windows users (scripts are provided in PowerShell)
3. **Git**: For cloning and managing the repository

## Step 1: Start Docker Desktop

Ensure Docker Desktop is running:
- Windows: Check system tray for Docker icon
- macOS: Check menu bar for Docker icon  
- Linux: Check that Docker daemon is running with `docker ps`

Verify Docker is working:
```bash
docker --version
docker compose --version
```

## Step 2: Start the Full Stack

### Quick Start (Recommended)
```powershell
# Start everything with monitoring
.\scripts\dev.ps1 -FullStack -Monitoring
```

### Granular Usage Options

#### Backend Services Only
```powershell
# Start all backend services without frontend
.\scripts\dev.ps1 -Backend
```

#### Individual Services
```powershell
# Start only Product Catalog Service
.\scripts\dev.ps1 -ProductCatalog

# Start only Order Service
.\scripts\dev.ps1 -OrderService

# Start only Frontend (requires backend services to be running)
.\scripts\dev.ps1 -Frontend
```

#### Additional Options
```powershell
# Start with automatic health checks
.\scripts\dev.ps1 -FullStack -HealthCheck

# Start with monitoring and health checks
.\scripts\dev.ps1 -FullStack -Monitoring -HealthCheck

# View all available options
.\scripts\dev.ps1 -Help
```

## Expected Port Mappings

| Service | Host Port | Container Port | Description |
|---------|-----------|----------------|-------------|
| **Frontend** | 3000 | 3000 | Next.js Customer Web App |
| **Product Catalog API** | 8000 | 8000 | FastAPI Product Service |
| **Order Service API** | 8003 | 8080 | Go Order Management API |
| **Product Catalog DB** | 5432 | 5432 | PostgreSQL (Products) |
| **Order Service DB** | 5434 | 5432 | PostgreSQL (Orders) |
| **Product Catalog Redis** | 6379 | 6379 | Redis Cache (Products) |
| **Order Service Redis** | 6380 | 6379 | Redis Cache (Orders) |
| **Redis Commander** | 8082 | 8081 | Redis Web UI (Orders) |

## Verification Commands

### Health Check Endpoints
```bash
# Product Catalog Service Health
curl http://localhost:8000/health

# Order Service Health  
curl http://localhost:8003/api/v1/health

# Product Catalog Root Info
curl http://localhost:8000/

# Order Service API Test
curl http://localhost:8003/api/v1/orders
```

### Expected Health Check Responses

**Product Catalog Service** (`/health`):
```json
{
  "status": "healthy",
  "database": "healthy", 
  "service": "product-catalog"
}
```

**Order Service** (`/api/v1/health`):
```json
{
  "status": "healthy"
}
```

### Database Connectivity Tests
```bash
# Test Product Catalog Database
docker exec -it product-catalog-db psql -U ecomarket -d product_catalog -c "SELECT version();"

# Test Order Service Database  
docker exec -it $(docker ps --format "table {{.Names}}" | grep postgres-orders) psql -U orders_user -d orders_db -c "SELECT version();"

# Test Redis Connections
docker exec -it product-catalog-redis redis-cli ping
docker exec -it $(docker ps --format "table {{.Names}}" | grep redis-orders) redis-cli ping
```

## Web Interface URLs

| Interface | URL | Description |
|-----------|-----|-------------|
| **Customer Web App** | http://localhost:3000 | Main frontend application |
| **Product Catalog API Docs** | http://localhost:8000/docs | FastAPI Swagger documentation |
| **Product Catalog Redoc** | http://localhost:8000/redoc | Alternative API documentation |
| **Redis Commander** | http://localhost:8082 | Redis database management UI |

## Service Information Endpoints

```bash
# Product Catalog Service Info
curl http://localhost:8000/api/v1/stats

# Product Catalog Service Endpoints
curl http://localhost:8000/
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: If ports are already in use, modify the docker-compose files to use different host ports
2. **Database Connection Issues**: Ensure containers have time to fully start before testing connections
3. **Frontend Build Issues**: Run `npm install` in the frontend directory if dependencies are missing

### Stopping Services
```powershell
# Stop all services
docker compose -f product-catalog-service/docker-compose.yml -f services/order-service/docker-compose.yml down

# Stop with volume cleanup
docker compose -f product-catalog-service/docker-compose.yml -f services/order-service/docker-compose.yml down -v

# Stop frontend (Ctrl+C in the terminal running npm run dev)
```

### Logs and Debugging
```bash
# View logs for specific services
docker compose -f product-catalog-service/docker-compose.yml logs product-catalog
docker compose -f services/order-service/docker-compose.yml logs order-service

# Follow logs in real-time
docker compose -f product-catalog-service/docker-compose.yml logs -f

# Check container status
docker ps
```

## Development Notes

- The frontend runs in development mode with hot reloading
- API services automatically reload on code changes (if volumes are mounted)
- Database data persists between container restarts via Docker volumes
- Redis data is also persisted via volumes for caching consistency

## Next Steps

After verifying all services are running:
1. Access the frontend at http://localhost:3000
2. Test API endpoints using the Swagger documentation
3. Monitor service health using the health check endpoints
4. Use Redis Commander to inspect cache data
