# EcoMarket Troubleshooting Guide

## Table of Contents
1. [Quick Diagnostic Commands](#quick-diagnostic-commands)
2. [Docker Issues](#docker-issues)
3. [Port Collision Problems](#port-collision-problems)
4. [Database Authentication Errors](#database-authentication-errors)
5. [Environment Variable Issues](#environment-variable-issues)
6. [Windows-Specific Issues](#windows-specific-issues)
7. [Service-Specific Problems](#service-specific-problems)
8. [Health Check Reference](#health-check-reference)
9. [Log Analysis](#log-analysis)
10. [Performance Issues](#performance-issues)

---

## Quick Diagnostic Commands

### Check System Status
```bash
# Check if Docker is running
docker --version
docker system info

# Check running containers
docker ps

# Check container resource usage
docker stats

# View all Docker Compose services status
docker compose ps
```

### View Service Logs
```bash
# View all service logs in real-time
docker compose logs -f

# View specific service logs
docker compose logs -f user-service
docker compose logs -f order-service

# View logs with timestamps
docker compose logs -ft

# View last 100 lines of logs
docker compose logs --tail=100
```

---

## Docker Issues

### Problem: Docker Desktop Not Running
**Symptoms:**
- `docker: command not found`
- `Cannot connect to the Docker daemon`
- `docker compose up` fails immediately

**Solutions:**
```bash
# Windows - Start Docker Desktop
# Check if Docker Desktop is running in system tray
# If not, launch Docker Desktop application

# Verify Docker is running
docker --version

# Check Docker service status (Linux/WSL)
sudo systemctl status docker

# Start Docker service (Linux/WSL)
sudo systemctl start docker
```

### Problem: Docker Compose File Not Found
**Symptoms:**
- `no configuration file provided`
- `compose file not found`

**Solutions:**
```bash
# Ensure you're in the project root directory
cd C:\Users\nucle\Projects\ISSessionsWarp2.0Demo

# Check if compose file exists
ls -la docker-compose*.yml

# Use specific compose file
docker compose -f docker-compose.yml up -d
```

### Problem: Container Build Failures
**Symptoms:**
- Build context errors
- Dockerfile not found
- Package installation failures

**Solutions:**
```bash
# Clean Docker build cache
docker builder prune

# Rebuild without cache
docker compose build --no-cache

# Remove all containers and rebuild
docker compose down --volumes
docker compose up --build
```

### Problem: Container Memory/Resource Issues
**Symptoms:**
- Containers randomly stopping
- Out of memory errors
- Slow performance

**Solutions:**
```bash
# Check Docker resource limits
docker system df

# Clean up unused resources
docker system prune -f

# Check individual container resources
docker stats --no-stream

# Increase Docker Desktop memory allocation (Windows)
# Docker Desktop → Settings → Resources → Advanced
# Increase Memory limit to 4GB or higher
```

---

## Port Collision Problems

### Problem: Port Already in Use
**Symptoms:**
- `bind: address already in use`
- `port is already allocated`
- Services fail to start

**Default Port Allocation:**
```
Frontend Services:
- Customer Web (Next.js): 3000
- Admin Dashboard (React): 3001
- Vendor Portal (React): 3002

Backend Services:
- User Service (Node.js): 8001
- Product Catalog (Python): 8002
- Order Service (Go): 8003
- Payment Service (Node.js): 8004
- Inventory Service (Python): 8005
- Notification Service: 8006
- Analytics Service: 8007

Infrastructure:
- PostgreSQL: 5432
- Redis: 6379
- MongoDB: 27017
- Prometheus: 9090
- Grafana: 3000 (conflicts with Customer Web!)
```

**Solutions:**

1. **Find conflicting processes:**
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8001

# Kill process by PID
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
sudo kill -9 <PID>
```

2. **Change service ports in .env:**
```bash
# Edit .env file
CUSTOMER_WEB_PORT=3100
GRAFANA_PORT=3300
USER_SERVICE_PORT=8101
```

3. **Stop conflicting Docker containers:**
```bash
# Stop all containers
docker stop $(docker ps -aq)

# Stop specific container
docker stop container_name
```

---

## Database Authentication Errors

### Problem: PostgreSQL Connection Failed
**Symptoms:**
- `FATAL: password authentication failed`
- `connection refused`
- `database does not exist`

**Solutions:**

1. **Check environment variables:**
```bash
# Verify .env file contains:
POSTGRES_USER=ecomarket_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ecomarket

# Or check individual service variables:
ORDER_SERVICE_DB_HOST=localhost
ORDER_SERVICE_DB_PORT=5432
ORDER_SERVICE_DB_NAME=order_service
ORDER_SERVICE_DB_USER=ecomarket_user
ORDER_SERVICE_DB_PASSWORD=your_secure_password
```

2. **Reset PostgreSQL container:**
```bash
# Stop and remove PostgreSQL container with volumes
docker compose down postgres
docker volume rm $(docker volume ls -q | grep postgres)

# Restart PostgreSQL
docker compose up -d postgres

# Wait for initialization and check logs
docker compose logs -f postgres
```

3. **Manual database connection test:**
```bash
# Connect to PostgreSQL container
docker exec -it postgres_container_name psql -U ecomarket_user -d ecomarket

# List databases
\l

# Connect to specific service database
\c order_service
```

### Problem: MongoDB Authentication Failed
**Symptoms:**
- `Authentication failed`
- `connection refused`
- `MongoNetworkError`

**Solutions:**

1. **Check MongoDB environment variables:**
```bash
# Verify .env file contains:
MONGODB_USERNAME=ecomarket_user
MONGODB_PASSWORD=your_secure_password
MONGODB_DATABASE=user_service

# User service specific:
USER_SERVICE_MONGODB_URI=mongodb://ecomarket_user:your_secure_password@localhost:27017/user_service
```

2. **Reset MongoDB container:**
```bash
# Stop and remove MongoDB container
docker compose down mongo
docker volume rm $(docker volume ls -q | grep mongo)

# Restart MongoDB
docker compose up -d mongo
docker compose logs -f mongo
```

### Problem: Redis Connection Issues
**Symptoms:**
- `Redis connection failed`
- `ECONNREFUSED`
- Cache not working

**Solutions:**

1. **Check Redis availability:**
```bash
# Test Redis connection
docker exec -it redis_container_name redis-cli ping
# Should return "PONG"

# Check Redis logs
docker compose logs redis
```

2. **Verify Redis configuration:**
```bash
# Check .env file:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Service-specific Redis URL:
ORDER_SERVICE_REDIS_URL=redis://localhost:6379
```

---

## Environment Variable Issues

### Problem: Missing .env File
**Symptoms:**
- Services using default/wrong values
- Database connection errors
- Missing API keys

**Solutions:**

1. **Create .env from template:**
```bash
# Copy template file
cp .env.template .env

# Edit with your values
# Windows
notepad .env

# VS Code
code .env
```

2. **Validate environment variables:**
```bash
# Check if variables are loaded
docker compose config

# Print environment for specific service
docker compose exec user-service env | grep -E "(DB|MONGO|REDIS)"
```

### Problem: Environment Variables Not Loading
**Symptoms:**
- Services can't connect to databases
- Features not working as expected
- Logging shows undefined variables

**Solutions:**

1. **Check .env file location:**
```bash
# Must be in project root, same level as docker-compose.yml
ls -la .env

# Check file contents (avoid sensitive data)
cat .env | grep -v PASSWORD
```

2. **Restart services to reload environment:**
```bash
# Restart specific service
docker compose restart user-service

# Restart all services
docker compose down
docker compose up -d
```

3. **Check for Windows line ending issues:**
```bash
# Convert CRLF to LF (Git Bash or WSL)
dos2unix .env

# Or configure Git to handle line endings
git config core.autocrlf true
```

---

## Windows-Specific Issues

### Problem: File Path Issues
**Symptoms:**
- Volume mounts not working
- Files not found errors
- Permission denied

**Solutions:**

1. **Use forward slashes in paths:**
```yaml
# In docker-compose.yml
volumes:
  - ./services/user-service:/app
  # Not: .\services\user-service:/app
```

2. **Enable file sharing in Docker Desktop:**
```
Docker Desktop → Settings → Resources → File Sharing
Add: C:\Users\nucle\Projects\ISSessionsWarp2.0Demo
```

3. **Use WSL2 backend:**
```
Docker Desktop → Settings → General → Use WSL 2 based engine
```

### Problem: Line Ending Issues (CRLF vs LF)
**Symptoms:**
- Shell scripts fail in containers
- `\r: command not found` errors
- Git shows all files as modified

**Solutions:**

1. **Configure Git to handle line endings:**
```bash
# For the repository
git config core.autocrlf true

# Convert existing files
git add --renormalize .
git commit -m "Normalize line endings"
```

2. **Convert specific files:**
```bash
# Using Git Bash or WSL
dos2unix .env
dos2unix scripts/*.sh

# Or in PowerShell
(Get-Content .env -Raw) -replace "`r`n", "`n" | Set-Content .env -NoNewline
```

### Problem: PowerShell Execution Policy
**Symptoms:**
- Cannot run .ps1 scripts
- `execution of scripts is disabled`

**Solutions:**
```powershell
# Check current policy
Get-ExecutionPolicy

# Allow local scripts (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or bypass for specific script
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1 -FullStack
```

### Problem: WSL Integration Issues
**Symptoms:**
- Docker commands not working in WSL
- File permission issues
- Network connectivity problems

**Solutions:**

1. **Enable WSL integration:**
```
Docker Desktop → Settings → Resources → WSL Integration
Enable integration with default WSL distro
```

2. **Fix file permissions in WSL:**
```bash
# Mount with proper permissions
sudo mount -t drvfs C: /mnt/c -o metadata,uid=1000,gid=1000
```

---

## Service-Specific Problems

### User Service (Node.js) Issues

**Problem: npm install fails**
```bash
# Clear npm cache
docker compose exec user-service npm cache clean --force

# Remove node_modules and reinstall
docker compose exec user-service rm -rf node_modules
docker compose restart user-service
```

**Problem: TypeScript compilation errors**
```bash
# Check TypeScript version
docker compose exec user-service npx tsc --version

# Rebuild TypeScript
docker compose exec user-service npm run build
```

### Order Service (Go) Issues

**Problem: Go module download fails**
```bash
# Clear Go module cache
docker compose exec order-service go clean -modcache

# Re-download modules
docker compose exec order-service go mod download
```

**Problem: Binary not found**
```bash
# Rebuild Go binary
docker compose exec order-service go build -o main .
```

### Product Catalog Service (Python) Issues

**Problem: pip install fails**
```bash
# Update pip
docker compose exec product-catalog-service pip install --upgrade pip

# Clear pip cache
docker compose exec product-catalog-service pip cache purge

# Reinstall requirements
docker compose exec product-catalog-service pip install -r requirements.txt
```

**Problem: Import errors**
```bash
# Check Python path
docker compose exec product-catalog-service python -c "import sys; print(sys.path)"

# Install in development mode
docker compose exec product-catalog-service pip install -e .
```

---

## Health Check Reference

### Service Health Endpoints

```bash
# User Service
curl http://localhost:8001/health
curl http://localhost:8001/api/users/health

# Order Service  
curl http://localhost:8003/health
curl http://localhost:8003/api/orders/health

# Product Catalog Service
curl http://localhost:8002/health
curl http://localhost:8002/api/products/health

# Frontend Services
curl http://localhost:3000/api/health  # Customer Web
curl http://localhost:3001/api/health  # Admin Dashboard
```

### Database Health Checks

```bash
# PostgreSQL
docker compose exec postgres pg_isready -U ecomarket_user

# MongoDB
docker compose exec mongo mongo --eval "db.adminCommand('ping')"

# Redis
docker compose exec redis redis-cli ping
```

### Infrastructure Health

```bash
# Prometheus metrics
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3000/api/health

# Check all container health
docker compose ps
```

---

## Log Analysis

### Understanding Log Patterns

**1. Database Connection Errors:**
```
# PostgreSQL
FATAL: password authentication failed for user "ecomarket_user"
connection to database failed: connection refused

# MongoDB
MongoNetworkError: failed to connect to server
Authentication failed

# Redis
Redis connection to localhost:6379 failed - connect ECONNREFUSED
```

**2. Port Binding Errors:**
```
Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use
Port 8001 is already in use
```

**3. Environment Variable Issues:**
```
Warning: Environment variable DB_PASSWORD is not set
undefined is not a valid connection string
```

### Log Analysis Commands

```bash
# Search for specific errors
docker compose logs | grep -i "error"
docker compose logs | grep -i "failed"
docker compose logs | grep -i "connection"

# Filter logs by service and time
docker compose logs --since="2024-01-01T10:00:00" user-service

# Export logs for analysis
docker compose logs > debug_logs.txt

# Follow logs with grep filter
docker compose logs -f | grep -E "(ERROR|WARN|FATAL)"
```

---

## Performance Issues

### Problem: Slow Database Queries
**Symptoms:**
- API responses taking > 5 seconds
- High CPU usage on database containers
- Connection timeouts

**Solutions:**

1. **Check database performance:**
```bash
# PostgreSQL slow queries
docker compose exec postgres psql -U ecomarket_user -d ecomarket -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# MongoDB performance
docker compose exec mongo mongo user_service --eval "
db.runCommand({profile: 2});
db.system.profile.find().limit(5).sort({ts: -1}).pretty();"
```

2. **Optimize Docker resources:**
```bash
# Increase container memory limits in docker-compose.yml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Problem: High Memory Usage
**Symptoms:**
- Containers being killed (OOMKilled)
- System running out of memory
- Docker Desktop consuming too much RAM

**Solutions:**

1. **Monitor container memory:**
```bash
# Check memory usage per container
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Check system memory
free -h  # Linux/WSL
Get-ComputerInfo | Select-Object TotalPhysicalMemory,AvailablePhysicalMemory  # Windows
```

2. **Limit container memory:**
```yaml
# In docker-compose.yml
services:
  user-service:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## Emergency Recovery Procedures

### Complete System Reset

```bash
# 1. Stop all services
docker compose down --volumes

# 2. Remove all containers and images
docker system prune -a --volumes

# 3. Remove project-specific volumes
docker volume ls | grep ecomarket | awk '{print $2}' | xargs docker volume rm

# 4. Restart fresh
docker compose up --build -d

# 5. Check service health
docker compose ps
docker compose logs -f
```

### Backup and Restore Data

```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U ecomarket_user ecomarket > backup.sql

# Restore PostgreSQL
docker compose exec -T postgres psql -U ecomarket_user ecomarket < backup.sql

# Backup MongoDB
docker compose exec mongo mongodump --db user_service --out /backup

# Restore MongoDB
docker compose exec mongo mongorestore --db user_service /backup/user_service
```

---

## Getting Help

### Support Escalation

1. **Gather diagnostic information:**
```bash
# System information
docker --version
docker compose version
uname -a  # Linux/Mac
systeminfo  # Windows

# Service status
docker compose ps
docker compose logs --tail=100 > error_logs.txt
```

2. **Check known issues:**
   - Review this troubleshooting guide
   - Check GitHub issues in the repository
   - Search Docker Hub for image-specific issues

3. **Report issues:**
   - Include error logs
   - Specify operating system and versions
   - Provide steps to reproduce
   - Include environment configuration (without sensitive data)

### Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [EcoMarket Development Guide](./DEVELOPER_GUIDE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Architecture Documentation](../README.md)

---

**Last Updated:** January 2024  
**Next Review:** Quarterly or after major system changes
