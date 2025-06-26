# Development Environment Setup

This document provides information on setting up the development environment for EcoMarket.

## **One-Command Startup**

The easiest way to start the entire EcoMarket development environment is with two simple commands:

```bash
npm install
npm run dev    # starts everything
```

This approach will start all services including the backend API, frontend React app, mobile Expo app, and Docker containers in parallel.

### Log Color Prefixes

When running `npm run dev`, you'll see colored output with prefixes to help identify which service is logging:

- **[backend]** - Backend API server logs (typically green)
- **[frontend]** - React frontend logs (typically blue)
- **[mobile]** - Expo mobile app logs (typically magenta)
- **[docker]** - Docker container logs (typically yellow)

### Shutdown

There are several ways to stop all services:

1. **Graceful shutdown** - Press **CTRL+C** in the terminal where `npm run dev` is running
2. **Manual shutdown** - Run the dedicated shutdown script:
   ```bash
   npm run dev:stop        # Graceful shutdown of all services
   npm run dev:force-stop  # Force immediate termination
   ```
3. **Emergency shutdown** - If processes are stuck, use the force option

The shutdown script will:
- Stop all frontend processes (React, Next.js, Expo)
- Terminate backend services and health checks
- Shut down Docker containers (with optional volume cleanup)
- Clean up background jobs and free up ports
- Show port status verification

### Troubleshooting

#### Port Conflicts
- If you see "Port already in use" errors, check what's running on the conflicting ports:
  - Frontend: typically port 3000
  - Backend: typically port 8000 or 5000
  - Mobile: typically port 8081
- Stop any conflicting processes or change ports in your configuration

#### Docker Issues
- **Docker daemon not running**: Ensure Docker Desktop is installed and running
- **Container startup failures**: Check Docker logs with `docker logs <container-name>`
- **Permission issues**: On Linux/Mac, you may need to run with `sudo` or add your user to the docker group

#### Expo Tunnel Issues
- **Tunnel connection failed**: Try switching to LAN mode in Expo CLI
- **QR code not working**: Ensure your phone and computer are on the same network
- **Expo Go app issues**: Clear the app cache or reinstall Expo Go

---

## Legacy: Individual Service Scripts (Deprecated)

> **⚠️ These standalone scripts are deprecated but kept for granular control when needed. For most development work, use the "One-Command Startup" approach above.**

### Script: up.ps1

The `up.ps1` script in the `scripts` directory is used to start the EcoMarket development stack using Docker Compose. Below are the core components and workflow:

### Parameters

- **`ComposeFile`**: Specifies the Docker Compose file to use. Default is `"..\infrastructure\docker-compose.dev.yml"`.
- **`EnvFile`**: Specifies the environment file to use. Default is `"..\.env"`.

### Workflow

1. **Starting the Stack**: The script initializes the Docker containers defined in the Docker Compose file and uses the specified environment variables.

   ```powershell
   docker compose --env-file $EnvFile -f $ComposeFile up -d --build
   ```

   - `--env-file $EnvFile`: Loads environment variables from the specified file.
   - `-f $ComposeFile`: Uses the specified Docker Compose file.
   - `up -d --build`: Builds the images before starting the containers in detached mode.

2. **Output Message**: Displays a message indicating that the EcoMarket dev stack is starting.

### Usage

#### Basic Usage

To start the development environment with default settings:

```powershell
.\scripts\up.ps1
```

#### Custom Configuration

To use a specific Docker Compose file and environment file:

```powershell
.\scripts\up.ps1 -ComposeFile "path\to\docker-compose.yml" -EnvFile "path\to\.env"
```

### Prerequisites

- Docker Desktop installed and running
- PowerShell (Windows PowerShell or PowerShell Core)
- Environment file (`.env`) configured with necessary variables
- Docker Compose file available at the specified path

### Environment File Setup

1. Copy `.env.template` to `.env` in the project root
2. Configure the necessary environment variables for your development setup
3. Ensure the `.env` file is not committed to version control (already in `.gitignore`)

### Troubleshooting

- **Docker not running**: Ensure Docker Desktop is installed and running
- **Environment file not found**: Check that the `.env` file exists at the specified path
- **Compose file not found**: Verify the Docker Compose file path is correct
- **Port conflicts**: Check if the required ports are already in use by other applications

### Related Files

- `scripts/up.ps1`: Main development startup script
- `.env.template`: Template for environment variables
- `infrastructure/docker-compose.dev.yml`: Development Docker Compose configuration
- `infrastructure/`: Directory containing Docker and infrastructure configurations
