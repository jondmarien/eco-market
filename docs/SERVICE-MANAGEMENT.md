# Backend Service Management

This document describes how to manage backend services using the provided PowerShell scripts.

## Available Scripts

### 1. `start-new-services.ps1`
Automatically discovers and starts any backend services that have `docker-compose.yml` files.

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File start-new-services.ps1
```

**What it does:**
- Scans the `services/` directory for `docker-compose.yml` files
- Checks if services are already running
- Starts new services using `docker compose -f services/[service]/docker-compose.yml up -d --build`
- Reports the status of all services after startup

### 2. `health-check-services.ps1`
Performs health checks on all running backend services.

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File health-check-services.ps1
```

**What it does:**
- Finds all running Docker Compose services
- Checks container status (running/stopped)
- Performs HTTP health checks on known service endpoints:
  - **order-service**: `http://localhost:8003/api/v1/health`
  - **user-service**: `http://localhost:8001/api/v1/health`
  - **payment-service**: `http://localhost:8002/api/v1/health`
  - **analytics-service**: `http://localhost:8004/health/`
  - **notification-service**: `http://localhost:8005/api/v1/health`

## Service Port Assignments

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| user-service | 8001 | `/api/v1/health` |
| payment-service | 8002 | `/api/v1/health` |
| order-service | 8003 | `/api/v1/health` |
| analytics-service | 8004 | `/health/` |
| notification-service | 8005 | `/api/v1/health` |

## Current Status

### Running Services
- ✅ **order-service** - Running with PostgreSQL and Redis
  - Service: `http://localhost:8003`
  - Database: PostgreSQL on port 5434
  - Cache: Redis on port 6380
  - Admin: Redis Commander on port 8082

### Available But Not Running
- 📝 **user-service** - Has Dockerfile, needs docker-compose.yml
- 📝 **analytics-service** - Has Dockerfile, needs docker-compose.yml
- 📝 **payment-service** - No Dockerfile yet
- 📝 **notification-service** - No Dockerfile yet

## Adding New Services

When a new service directory appears with a `docker-compose.yml` file:

1. Run the start script to automatically detect and start it:
   ```powershell
   powershell -ExecutionPolicy Bypass -File start-new-services.ps1
   ```

2. Verify the service is healthy:
   ```powershell
   powershell -ExecutionPolicy Bypass -File health-check-services.ps1
   ```

## Manual Service Management

For individual service management, use Docker Compose directly:

```powershell
# Start a specific service
docker compose -f services/[service-name]/docker-compose.yml up -d --build

# Stop a specific service
docker compose -f services/[service-name]/docker-compose.yml down

# View logs
docker compose -f services/[service-name]/docker-compose.yml logs -f

# Check status
docker compose -f services/[service-name]/docker-compose.yml ps
```

## Troubleshooting

1. **Service won't start**: Check Docker logs
   ```powershell
   docker compose -f services/[service-name]/docker-compose.yml logs
   ```

2. **Health check fails**: Verify the service is running and the endpoint is correct
   ```powershell
   curl http://localhost:[port]/[health-endpoint]
   ```

3. **Port conflicts**: Make sure no other services are using the same ports
   ```powershell
   netstat -an | findstr :[port]
   ```
