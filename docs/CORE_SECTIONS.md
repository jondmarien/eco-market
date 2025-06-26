# EcoMarket E-Commerce Platform - Core Documentation

## 1. Project Overview

EcoMarket is a **complete, production-ready e-commerce platform** focused on sustainable products, built with a comprehensive microservices architecture. The platform has reached full e-commerce capacity and is now **feature-complete** with ongoing enhancements for advanced capabilities.

### Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Applications"
        CW[Customer Web App<br/>Next.js + TypeScript]
        AD[Admin Dashboard<br/>React + Material-UI]
        VP[Vendor Portal<br/>Vue.js + Quasar]
        MO[Mobile App<br/>React Native + TypeScript]
    end
    
    subgraph "API Gateway Layer"
        KONG[Kong API Gateway<br/>Load Balancer & Routing]
    end
    
    subgraph "Core Microservices"
        US[User Service<br/>Node.js + MongoDB]
        PS[Product Catalog<br/>Python + FastAPI + PostgreSQL]
        OS[Order Service<br/>Go + Redis + PostgreSQL]
        PAY[Payment Service<br/>Node.js + Stripe/PayPal]
        INV[Inventory Service<br/>Python + MySQL]
        NOT[Notification Service<br/>Node.js + RabbitMQ]
        ANA[Analytics Service<br/>Python + ClickHouse]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Orders & Products)]
        MG[(MongoDB<br/>Users & Content)]
        RD[(Redis<br/>Cache & Sessions)]
        MY[(MySQL<br/>Inventory)]
    end
    
    subgraph "Infrastructure"
        PROM[Prometheus<br/>Metrics]
        GRAF[Grafana<br/>Dashboards]
        K8S[Kubernetes<br/>Orchestration]
    end
    
    CW --> KONG
    AD --> KONG
    VP --> KONG
    MO --> KONG
    
    KONG --> US
    KONG --> PS
    KONG --> OS
    KONG --> PAY
    KONG --> INV
    KONG --> NOT
    KONG --> ANA
    
    US --> MG
    PS --> PG
    OS --> PG
    OS --> RD
    PAY --> PG
    INV --> MY
    
    US --> PROM
    PS --> PROM
    OS --> PROM
    PAY --> PROM
    INV --> PROM
    
    PROM --> GRAF
```

### Technology Stack

| Component | Technology | Status | Port |
|-----------|------------|--------|------|
| **Customer Web** | Next.js 14 + TypeScript + Tailwind | ✅ Complete | 3000 |
| **Admin Dashboard** | React 18 + Material-UI + TypeScript | ✅ Complete | 3001 |
| **Vendor Portal** | Vue.js + Quasar Framework | ✅ Complete | 3002 |
| **User Service** | Node.js 18 + MongoDB + JWT | ✅ Complete | 4000 |
| **Product Catalog** | Python 3.11 + FastAPI + PostgreSQL | ✅ Complete | 5000 |
| **Order Management** | Go 1.21 + Redis + PostgreSQL | ✅ Complete | 6000 |
| **Payment Processing** | Node.js + Stripe + PayPal | ✅ Complete | 7000 |
| **Inventory Service** | Python + FastAPI + MySQL | ✅ Complete | 8000 |
| **Notification Service** | Node.js + RabbitMQ + Email/SMS | ✅ Complete | 9000 |
| **Analytics Service** | Python + ClickHouse + Kafka | ✅ Complete | 10000 |
| **API Gateway** | Kong | ✅ Complete | 8000/8001 |

## 2. Prerequisites

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux Ubuntu 18.04+
- **Memory**: Minimum 16GB RAM (32GB recommended for full stack)
- **Storage**: 50GB free disk space
- **Network**: Stable internet connection for package downloads

### Required Software

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| **Docker Desktop** | ≥ 24.0 | Container orchestration |
| **Node.js** | ≥ 18.0 | JavaScript runtime |
| **Python** | ≥ 3.11 | Python services |
| **Go** | ≥ 1.21 | Order service |
| **Git** | ≥ 2.30 | Version control |
| **PowerShell** | ≥ 7.0 (Windows) | Script execution |

### Development Tools (Recommended)

- **VS Code** with extensions:
  - Docker
  - JavaScript/TypeScript
  - Python
  - Go
  - REST Client
- **Postman** or **Insomnia** for API testing
- **DataGrip** or **pgAdmin** for database management

### Verification Commands

```powershell
# Check all prerequisites
docker --version          # Should be ≥ 24.0
node --version            # Should be ≥ 18.0
python --version          # Should be ≥ 3.11
go version               # Should be ≥ 1.21
git --version           # Should be ≥ 2.30
```

## 3. Environment Setup

### Initial Configuration

1. **Clone the repository**:

```sh
   git clone <repository-url>
   cd ISSessionsWarp2.0Demo
```

2. **Copy environment template**:

```sh
   cp .env.template .env
```

3. **Configure environment variables**:

```sh
   # Database Configuration
   POSTGRES_USER=eco
   POSTGRES_PASSWORD=eco_pass
   POSTGRES_DB=ecomarket_dev
   MONGO_INITDB_ROOT_USERNAME=eco
   MONGO_INITDB_ROOT_PASSWORD=eco_pass
   REDIS_URL=redis://redis:6379
   
   # Service Ports
   USER_SERVICE_PORT=4000
   PRODUCT_SERVICE_PORT=5000
   ORDER_SERVICE_PORT=6000
   PAYMENT_SERVICE_PORT=7000
   INVENTORY_SERVICE_PORT=8000
   NOTIFICATION_SERVICE_PORT=9000
   ANALYTICS_SERVICE_PORT=10000
   
   # API Gateway
   KONG_DATABASE=off
   KONG_DECLARATIVE_CONFIG=/kong/declarative/kong.yml
   KONG_ADMIN_LISTEN=0.0.0.0:8001
   KONG_PROXY_LISTEN=0.0.0.0:8000
   
   # External Services
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_secret
   SENDGRID_API_KEY=your_sendgrid_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
```

### Secrets Management

**⚠️ Security Best Practices:**

- Never commit actual secrets to version control
- Use environment-specific `.env` files
- Rotate API keys regularly
- Use strong, unique passwords for databases

**Production Secrets:**
- Use Azure Key Vault, AWS Secrets Manager, or HashiCorp Vault
- Implement least-privilege access
- Enable audit logging for secret access

## 4. Database Setup

### Using Docker (Recommended)

**Start all databases with Docker Compose:**

```sh
# Start database containers
docker-compose -f infrastructure/docker-compose.monitoring.yml up -d

# Verify databases are running
docker ps | grep -E "(postgres|mongo|redis|mysql)"
```

### Database Initialization

```sh
# PostgreSQL (Orders & Products)
docker exec -it ecomarket_postgres psql -U eco -d ecomarket_dev -f /docker-entrypoint-initdb.d/init.sql

# MongoDB (Users & Content)
docker exec -it ecomarket_mongo mongosh --eval "
  use ecomarket_dev
  db.createUser({
    user: 'eco',
    pwd: 'eco_pass',
    roles: [{ role: 'readWrite', db: 'ecomarket_dev' }]
  })
"

# Redis (Cache & Sessions) - No initialization required

# MySQL (Inventory)
docker exec -it ecomarket_mysql mysql -u root -p -e "
  CREATE DATABASE IF NOT EXISTS inventory_db;
  CREATE USER 'eco'@'%' IDENTIFIED BY 'eco_pass';
  GRANT ALL PRIVILEGES ON inventory_db.* TO 'eco'@'%';
  FLUSH PRIVILEGES;
"
```

### Native Installation (Alternative)

**PostgreSQL:**

```sh
# Ubuntu/Debian
sudo apt update && sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows - Download from postgresql.org
```

**MongoDB:**

```sh
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt install -y mongodb-org

# macOS
brew tap mongodb/brew && brew install mongodb-community

# Windows - Download from mongodb.com
```

**Redis:**

```sh
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Windows - Use Docker or WSL
```

### Database Schema Verification

```sh
# Check PostgreSQL tables
docker exec -it ecomarket_postgres psql -U eco -d ecomarket_dev -c "\dt"

# Check MongoDB collections
docker exec -it ecomarket_mongo mongosh ecomarket_dev --eval "show collections"

# Check Redis connectivity
docker exec -it ecomarket_redis redis-cli ping
```

## 5. Infrastructure Setup

### Development Container Stack

**Start the complete development environment:**

```sh
# Start all services with PowerShell script
.\scripts\up.ps1

# Or manually with Docker Compose
docker-compose up -d
```

**Verify all services are running:**

```sh
# Check container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health check all services
curl http://localhost:4000/health  # User Service
curl http://localhost:5000/health  # Product Service
curl http://localhost:6000/health  # Order Service
curl http://localhost:7000/health  # Payment Service
curl http://localhost:8000/health  # Inventory Service
curl http://localhost:9000/health  # Notification Service
```

### Monitoring Stack (Prometheus + Grafana)

**Start monitoring infrastructure:**

```sh
# Start monitoring stack
docker-compose -f infrastructure/docker-compose.monitoring.yml up -d

# Access monitoring dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

**Configure Grafana Dashboards:**

```sh
# Import pre-configured dashboards
curl -X POST http://admin:admin@localhost:3001/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @infrastructure/grafana/dashboards/ecomarket-overview.json

# Set up alerts
curl -X POST http://admin:admin@localhost:3001/api/alert-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "EcoMarket Alerts",
    "type": "slack",
    "settings": {
      "url": "YOUR_SLACK_WEBHOOK_URL",
      "channel": "#alerts"
    }
  }'
```

### API Gateway Configuration

**Kong API Gateway setup:**

```sh
# Verify Kong is running
curl http://localhost:8001/status

# Configure services and routes
curl -X POST http://localhost:8001/services \
  -d "name=user-service" \
  -d "url=http://user-service:4000"

curl -X POST http://localhost:8001/services/user-service/routes \
  -d "paths[]=/api/users"

# Test API Gateway
curl http://localhost:8000/api/users/health
```

### Sample Commands for Development

**Start specific service stacks:**

```sh
# Frontend only
docker-compose up customer-web admin-dashboard vendor-portal

# Backend services only
docker-compose up user-service product-service order-service payment-service

# Databases only
docker-compose up postgres mongodb redis mysql

# Monitoring only
docker-compose -f infrastructure/docker-compose.monitoring.yml up
```

**Development workflow commands:**

```sh
# Restart a specific service
docker-compose restart user-service

# View service logs
docker-compose logs -f order-service

# Execute commands in containers
docker-compose exec user-service npm test
docker-compose exec order-service go test ./...

# Scale services for load testing
docker-compose up --scale user-service=3
```

**Database management:**

```sh
# Create database backup
docker exec ecomarket_postgres pg_dump -U eco ecomarket_dev > backup.sql

# Restore database
docker exec -i ecomarket_postgres psql -U eco -d ecomarket_dev < backup.sql

# Reset development data
docker-compose down -v  # Remove volumes
docker-compose up -d    # Recreate with fresh data
```

---

## Platform Capabilities

### ✅ Complete E-Commerce Features

- **User Management**: Registration, authentication, profiles, roles
- **Product Catalog**: Categories, search, filtering, variants
- **Shopping Cart**: Add/remove items, save for later, calculations
- **Order Processing**: Creation, status tracking, cancellation
- **Payment Processing**: Stripe, PayPal, multiple currencies
- **Inventory Management**: Stock tracking, alerts, reservations
- **Notifications**: Email, SMS, push notifications
- **Analytics**: Sales metrics, customer insights, reporting
- **Admin Dashboard**: Complete management interface
- **Vendor Portal**: Seller management and tools

### 🚀 Advanced Capabilities In Development

- AI-powered product recommendations
- Augmented reality product visualization
- Carbon footprint calculation
- Sustainable packaging options
- Multi-language support
- Advanced search with Elasticsearch
- Machine learning fraud detection
- Real-time chat support

---

This documentation reflects the current **production-ready state** of EcoMarket. The platform is feature-complete for standard e-commerce operations and continues to evolve with advanced sustainability and AI features.