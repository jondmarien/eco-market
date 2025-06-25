Param(
  [string]$ComposeFile = "..\infrastructure\docker-compose.dev.yml",
  [string]$EnvFile = "..\.env"
)
Write-Host "Starting EcoMarket dev stack..."
docker compose --env-file $EnvFile -f $ComposeFile up -d --build
