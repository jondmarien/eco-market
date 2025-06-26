# EcoMarket Development Environment - Inventory & Gap Analysis

## Overview

This document provides a comprehensive inventory and gap analysis of the EcoMarket development environment, covering all existing PowerShell helper scripts, Docker Compose configurations, frontend applications, and health check endpoints.

## Existing PowerShell Helper Scripts

### 1. Root Directory Scripts

#### `health-check-services.ps1`
- **Purpose**: Checks health of all running Docker Compose backend services
- **Coverage**: Automatically discovers services in `services/` directory with docker-compose files
- **Health Endpoints Covered**:
  - Order Service: `http://localhost:8003/api/v1/health`
  - User Service: `http://localhost:8001/api/v1/health`
  - Payment Service: `http://localhost:8002/api/v1/health`
  - Analytics Service: `http://localhost:8004/health/` (Note: Different port mapping)
  - Notification Service: `http://localhost:8005/api/v1/health`

#### `start-new-services.ps1`
- **Purpose**: Finds and starts services with docker-compose files in `services/` directory
- **Behavior**: Checks for running services before starting, uses `docker compose up -d --build`
- **Status Reporting**: Shows running services with ✅/❌ indicators

### 2. Scripts Directory (`scripts/`)

#### `scripts/up.ps1`
- **Purpose**: Main infrastructure startup script with flexible options
- **Primary Docker Compose File**: `../infrastructure/docker-compose.dev.yml`
- **Optional Monitoring**: `../infrastructure/docker-compose.monitoring.yml`
- **Supported Flags**:
  - `-AllServices`: Start complete infrastructure
  - `-Monitoring`: Include Prometheus/Grafana stack
  - `-ProductCatalog`, `-OrderService`, `-InventoryService`: Individual service flags
  - `-ComposeFiles`: Explicit compose file specification

#### `scripts/start-all.ps1`
- **Purpose**: Convenience script that starts complete environment with monitoring
- **Implementation**: Wrapper around `up.ps1 -AllServices -Monitoring`

## Docker Compose Infrastructure

### Primary Stack (`infrastructure/docker-compose.dev.yml`)

**Databases:**
- PostgreSQL (primary): Port 5432
- PostgreSQL (orders): Port 5434
- MongoDB: Port 27017
- Redis (primary): Port 6379
- Redis (orders): Port 6380

**Backend Services:**
- user-service: Port 8001 (mapped from container port per env var)
- product-catalog: Port 8000
- order-service: Port 8003 (mapped from container port 8080)
- payment-service: Port 7000
- inventory-service: Port 8005
- analytics-service: Port 9000
- notification-service: Port 9001

**Management Tools:**
- pgAdmin: Port 8080 (admin@ecomarket.dev / admin)
- Redis Commander: Port 8082
- Kong API Gateway: Port 8090 (proxy), 8001 (admin)

### Monitoring Stack (`infrastructure/docker-compose.monitoring.yml`)

**Monitoring Services:**
- Prometheus: Port 9090
- Grafana: Port 3000 (admin / admin)
- Node Exporter: Port 9100

## Frontend Applications

### Application Inventory

| Application | Directory | Package Manager | Start Command | Port | Technology |
|------------|-----------|----------------|---------------|------|------------|
| **customer-web** | `frontend/customer-web/` | npm (individual) | `npm run dev` | 3000 | Next.js 15.3.4 |
| **admin-dashboard** | `apps/admin-dashboard/` | npm (individual) | `npm run start` | 3001 | React CRA 18.2.0 |
| **vendor-portal** | `apps/vendor-portal/` | npm (individual) | `npm run start` | 3002 | React CRA 18.2.0 |
| **mobile-app** | `mobile-app/` | npm (individual) | `npm run start` | 19006 | Expo 49.0.0 |

### Key Findings

**❌ No pnpm Workspace Configuration:**
- The task mentioned pnpm filter commands, but this project does NOT use pnpm workspaces
- Each frontend application has its own `package.json` and must be started individually
- Correct commands are:
  - `cd frontend/customer-web && npm run dev`
  - `cd apps/admin-dashboard && npm run start`
  - `cd apps/vendor-portal && npm run start`
  - `cd mobile-app && npm run start`

**✅ Additional Application Discovered:**
- Found `vendor-portal` in addition to the three mentioned in the task
- Uses same React CRA setup as admin-dashboard

## Health Check Endpoints Analysis

### Current Coverage in `health-check-services.ps1`

| Service | Endpoint | Port | Status |
|---------|----------|------|--------|
| User Service | `/api/v1/health` | 8001 | ✅ Covered |
| Payment Service | `/api/v1/health` | 7000 | ❌ **Port Mismatch** (script checks 8002) |
| Order Service | `/api/v1/health` | 8003 | ✅ Covered |
| Analytics Service | `/health/` | 9000 | ❌ **Port Mismatch** (script checks 8004) |
| Notification Service | `/api/v1/health` | 9001 | ❌ **Port Mismatch** (script checks 8005) |

### Gap Analysis - Health Check Issues

**🔴 Critical Port Mismatches Found:**
1. **Payment Service**: Script checks port 8002, actual service runs on 7000
2. **Analytics Service**: Script checks port 8004, actual service runs on 9000  
3. **Notification Service**: Script checks port 8005, actual service runs on 9001

**Missing Coverage:**
- Product Catalog Service (Port 8000) - No health endpoint configured
- Inventory Service (Port 8005) - No health endpoint configured

## Docker Compose File Requirements

### Full Stack Configuration

**Required for Complete Development Environment:**
1. **Primary**: `infrastructure/docker-compose.dev.yml`
   - All backend services, databases, management tools
   - Complete infrastructure for development

2. **Optional**: `infrastructure/docker-compose.monitoring.yml`
   - Prometheus, Grafana, Node Exporter
   - Used with `-Monitoring` flag

**Alternative Individual Service Files:**
- `product-catalog-service/docker-compose.yml`
- `services/order-service/docker-compose.yml`
- Individual service docker-compose files (referenced in `up.ps1`)

## Recommendations & Gap Resolution

### 1. Health Check Corrections Needed
```powershell
# Update health-check-services.ps1 with correct ports:
# Payment Service: localhost:7000/api/v1/health (not 8002)
# Analytics Service: localhost:9000/health/ (not 8004)  
# Notification Service: localhost:9001/api/v1/health (not 8005)
```

### 2. Frontend Startup Commands
```bash
# Correct commands (not pnpm workspace):
cd frontend/customer-web && npm run dev       # Next.js dev server
cd apps/admin-dashboard && npm run start     # React CRA
cd apps/vendor-portal && npm run start       # React CRA  
cd mobile-app && npm run start               # Expo development server
```

### 3. Missing Health Endpoints
Consider adding health endpoints for:
- Product Catalog Service (currently only has `/docs`)
- Inventory Service (no health endpoint found)

## New Orchestrator Features

The new `dev.ps1` orchestrator addresses all identified gaps:

✅ **Corrected Health Check Endpoints**
✅ **Proper Frontend Startup Commands** 
✅ **Complete Docker Compose Integration**
✅ **Individual Service Control**
✅ **Process Management & Monitoring**
✅ **Graceful Shutdown Handling**

### Usage Examples

```powershell
# Start everything
.\dev.ps1 -FullStack

# Start only backend with monitoring  
.\dev.ps1 -Backend -Monitoring

# Start individual frontends
.\dev.ps1 -CustomerWeb
.\dev.ps1 -AdminDashboard

# Health checks with corrected endpoints
.\dev.ps1 -HealthCheck

# Service status monitoring
.\dev.ps1 -Status

# Graceful shutdown
.\dev.ps1 -Stop
```

## Environment Variables Dependencies

The infrastructure relies on environment variables defined in `.env`:
- Database credentials (POSTGRES_USER, POSTGRES_PASSWORD, etc.)
- Service ports (USER_SERVICE_PORT, etc.)
- MongoDB credentials (MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD)
- Redis configuration (REDIS_URL)
- Kong configuration (KONG_DATABASE, KONG_DECLARATIVE_CONFIG, etc.)

## Conclusion

This inventory identified several critical gaps in the existing helper scripts, particularly around health check port mismatches and the lack of a unified development environment orchestrator. The new `dev.ps1` script provides comprehensive solution that:

1. ✅ Correctly handles all Docker Compose files for full stack
2. ✅ Properly starts each frontend with individual npm commands (not pnpm workspace)
3. ✅ Implements corrected health check endpoints
4. ✅ Provides modular startup options (backend-only, frontend-only, specific apps)
5. ✅ Includes proper process management and graceful shutdown

The orchestrator ensures no service is overlooked and provides a robust foundation for the EcoMarket development environment.
