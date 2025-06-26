# Development Environment Setup

This document provides information on setting up the development environment for EcoMarket.

## **Unified Orchestrator (dev.ps1)**

The EcoMarket development environment is managed through a unified PowerShell orchestrator script that provides comprehensive control over all services and components.

### Installation Prerequisites

Before using the development orchestrator, ensure you have the following installed:

- **PowerShell 7** - Required for cross-platform compatibility and advanced features
- **Docker Desktop** - For containerized services (database, cache, etc.)
- **Node.js (v18+)** - For frontend and backend JavaScript/TypeScript services

### Using dev.ps1

The [dev-ps1 Orchestrator Guide](dev-ps1-orchestrator.md) provides a detailed overview of how to use the script effectively to manage the EcoMarket development stack.

### Colored Log Prefixes

The orchestrator produces colored output with prefixes to help identify which service is logging:

- **[BACKEND]** - Backend API server logs (green)
- **[FRONTEND]** - React frontend logs (blue)
- **[MOBILE]** - Expo mobile app logs (magenta)
- **[DOCKER]** - Docker container logs (yellow)
- **[HEALTH]** - Health check results (cyan)
- **[ORCHESTRATOR]** - Script coordination messages (white)

### Shutdown Instructions

#### Graceful Shutdown
For a clean shutdown that properly terminates all services:

```powershell
./dev.ps1 -Stop
```

Or press **CTRL+C** in the terminal where the orchestrator is running. The graceful shutdown process will:
- Stop all frontend processes (React, Next.js, Expo)
- Terminate backend services and health checks
- Shut down Docker containers with proper cleanup
- Free up occupied ports
- Display port status verification

#### Forced Shutdown
If processes are stuck or unresponsive:

```powershell
./dev.ps1 -Stop -Force
```

This will immediately terminate all processes without waiting for graceful cleanup.

### Troubleshooting

#### Port Conflicts
- **Issue**: "Port already in use" errors when running `dev.ps1`
- **Solution**: 
  - Check conflicting ports: Frontend (3000), Backend (8000/5000), Mobile (8081)
  - Use `./dev.ps1 -Stop -Force` to clean up stuck processes
  - Verify port availability with `netstat -an | findstr :PORT_NUMBER`

#### Docker Issues
- **Docker daemon not running**: 
  - Ensure Docker Desktop is installed and running
  - Check Docker status with `docker --version`
- **Container startup failures**: 
  - Run `./dev.ps1 -HealthCheck` to diagnose issues
  - Check specific container logs: `docker logs <container-name>`
- **Permission issues**: 
  - On Linux/Mac: Add user to docker group or use `sudo`
  - On Windows: Ensure Docker Desktop has proper permissions

#### Expo and Mobile Development
- **Tunnel connection failed**: 
  - Use `./dev.ps1 -CustomerWeb` instead of full stack if mobile isn't needed
  - Try switching to LAN mode in Expo CLI
- **QR code not working**: 
  - Ensure phone and computer are on the same network
  - Check firewall settings allowing port 8081
- **Expo Go app issues**: 
  - Clear Expo Go app cache
  - Reinstall Expo Go if problems persist

#### PowerShell Issues
- **Script execution policy errors**:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- **Module not found errors**: 
  - Ensure PowerShell 7+ is installed
  - Update PowerShell modules if needed

#### General Debugging
- Use `./dev.ps1 -HealthCheck` to verify all services are responding
- Check individual service logs using the colored prefixes
- Restart specific services by stopping with `-Stop` and starting with the appropriate flag
