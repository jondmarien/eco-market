# Development Environment Setup

This document provides information on setting up the development environment for EcoMarket using the provided PowerShell script.

## Script: up.ps1

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
