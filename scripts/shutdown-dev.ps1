#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Comprehensive shutdown script for EcoMarket development environment

.DESCRIPTION
    This script performs an exhaustive shutdown of all development environment components:
    - Stops all frontend processes (React, Next.js, Expo)
    - Terminates backend services and health checks
    - Shuts down Docker containers and volumes
    - Cleans up background jobs and processes
    - Frees up ports and resources

.PARAMETER Force
    Force kill processes without graceful shutdown

.PARAMETER KeepVolumes
    Keep Docker volumes (don't remove with --volumes flag)

.PARAMETER Verbose
    Show detailed output during shutdown process

.PARAMETER Help
    Show detailed help information

.EXAMPLE
    .\scripts\shutdown-dev.ps1
    Perform standard graceful shutdown

.EXAMPLE
    .\scripts\shutdown-dev.ps1 -Force
    Force kill all processes immediately

.EXAMPLE
    .\scripts\shutdown-dev.ps1 -KeepVolumes -Verbose
    Shutdown with verbose output while preserving Docker volumes
#>

Param(
    [switch]$Force,
    [switch]$KeepVolumes,
    [switch]$Verbose,
    [switch]$Help
)

function Show-Help {
    Write-Host @"
=============================================================================
    EcoMarket Development Environment Shutdown Script
=============================================================================

USAGE:
    .\scripts\shutdown-dev.ps1 [OPTIONS]

OPTIONS:
    -Force                      Force kill processes without graceful shutdown
    -KeepVolumes               Keep Docker volumes (don't use --volumes flag)
    -Verbose                   Show detailed output during shutdown
    -Help                      Show this help message

EXAMPLES:
    # Standard graceful shutdown
    .\scripts\shutdown-dev.ps1

    # Force shutdown (immediate termination)
    .\scripts\shutdown-dev.ps1 -Force

    # Verbose shutdown with volume preservation
    .\scripts\shutdown-dev.ps1 -KeepVolumes -Verbose

WHAT THIS SCRIPT SHUTS DOWN:
    ✅ Frontend processes (React, Next.js, Expo)
    ✅ Backend API servers
    ✅ Docker containers and services
    ✅ Health check background jobs
    ✅ Log monitoring processes
    ✅ Port bindings and resources
    ✅ Temporary files and logs

=============================================================================
"@
}

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
    Write-Host "$Message" -ForegroundColor $color
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Yellow
    Write-Host "=" * 80 -ForegroundColor Cyan
}

function Stop-FrontendProcesses {
    param([bool]$ForceKill = $false)
    
    Write-Section "STOPPING FRONTEND PROCESSES"
    
    # Define common frontend process patterns
    $frontendPatterns = @(
        "npm.*dev",
        "npm.*start",
        "next.*dev",
        "react-scripts.*start",
        "expo.*start",
        "node.*dev",
        "node.*start"
    )
    
    $stoppedCount = 0
    
    foreach ($pattern in $frontendPatterns) {
        try {
            $processes = Get-Process | Where-Object { 
                $_.ProcessName -match "node|npm|powershell|pwsh" -and 
                $_.CommandLine -match $pattern 
            } -ErrorAction SilentlyContinue
            
            if ($processes) {
                foreach ($proc in $processes) {
                    try {
                        if ($Verbose) {
                            Write-Status "Found process: $($proc.ProcessName) (PID: $($proc.Id))" "INFO"
                        }
                        
                        if ($ForceKill) {
                            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                            Write-Status "Force killed: $($proc.ProcessName) (PID: $($proc.Id))" "SUCCESS"
                        } else {
                            $proc.CloseMainWindow()
                            Start-Sleep -Milliseconds 500
                            if (!$proc.HasExited) {
                                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                            }
                            Write-Status "Stopped: $($proc.ProcessName) (PID: $($proc.Id))" "SUCCESS"
                        }
                        $stoppedCount++
                    } catch {
                        if ($Verbose) {
                            Write-Status "Error stopping process $($proc.Id): $($_.Exception.Message)" "WARNING"
                        }
                    }
                }
            }
        } catch {
            if ($Verbose) {
                Write-Status "Error searching for pattern '$pattern': $($_.Exception.Message)" "WARNING"
            }
        }
    }
    
    # Also stop processes by port (common development ports)
    $devPorts = @(3000, 3001, 3002, 8081, 19000, 19001, 19002, 19006)
    
    foreach ($port in $devPorts) {
        try {
            $connections = netstat -ano | Select-String ":$port\s" | ForEach-Object {
                $fields = $_.ToString().Split(' ', [StringSplitOptions]::RemoveEmptyEntries)
                if ($fields.Length -ge 5) {
                    $fields[-1]  # PID is the last field
                }
            }
            
            foreach ($pid in $connections) {
                if ($pid -and $pid -match '^\d+$') {
                    try {
                        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                        if ($process) {
                            if ($ForceKill) {
                                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                            } else {
                                $process.CloseMainWindow()
                                Start-Sleep -Milliseconds 500
                                if (!$process.HasExited) {
                                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                                }
                            }
                            Write-Status "Freed port $port (PID: $pid)" "SUCCESS"
                            $stoppedCount++
                        }
                    } catch {
                        if ($Verbose) {
                            Write-Status "Error stopping process on port $port (PID: $pid): $($_.Exception.Message)" "WARNING"
                        }
                    }
                }
            }
        } catch {
            if ($Verbose) {
                $errorMsg = $_.Exception.Message
                Write-Status "Error checking port ${port}: $errorMsg" "WARNING"
            }
        }
    }
    
    Write-Status "Stopped $stoppedCount frontend processes" "SUCCESS"
}

function Stop-BackendServices {
    Write-Section "STOPPING BACKEND SERVICES"
    
    # Stop Docker containers using all possible compose files
    $composeFiles = @(
        "../infrastructure/docker-compose.dev.yml",
        "../infrastructure/docker-compose.monitoring.yml",
        "../product-catalog-service/docker-compose.yml",
        "../services/order-service/docker-compose.yml",
        "../inventory-service/docker-compose.yml"
    )
    
    $envFile = "../.env"
    $volumeFlag = if ($KeepVolumes) { "" } else { "--volumes" }
    $stoppedServices = 0
    
    foreach ($composeFile in $composeFiles) {
        if (Test-Path $composeFile) {
            try {
                Write-Status "Stopping services in: ${composeFile}" "INFO"
                
                $dockerComposeCmd = "docker compose --env-file `"$envFile`" -f `"$composeFile`" down $volumeFlag --remove-orphans"
                
                if ($Verbose) {
                    Write-Status "Executing: $dockerComposeCmd" "INFO"
                }
                
                Invoke-Expression $dockerComposeCmd
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Status "✅ Stopped services in: $composeFile" "SUCCESS"
                    $stoppedServices++
                } else {
                    Write-Status "⚠️  Warning stopping services in: ${composeFile}" "WARNING"
                }
            } catch {
                Write-Status "Error stopping compose file ${composeFile}: $($_.Exception.Message)" "ERROR"
            }
        } else {
            if ($Verbose) {
                Write-Status "Compose file not found: ${composeFile}" "WARNING"
            }
        }
    }
    
    # Force stop any remaining EcoMarket containers
    try {
        $ecomarketContainers = docker ps -aq --filter "name=ecomarket" 2>$null
        if ($ecomarketContainers) {
            Write-Status "Force stopping remaining EcoMarket containers..." "INFO"
            docker stop $ecomarketContainers 2>$null
            docker rm $ecomarketContainers 2>$null
            Write-Status "✅ Removed remaining EcoMarket containers" "SUCCESS"
        }
    } catch {
        if ($Verbose) {
            Write-Status "Error cleaning up containers: $($_.Exception.Message)" "WARNING"
        }
    }
    
    Write-Status "Processed $stoppedServices compose files" "SUCCESS"
}

function Stop-BackgroundJobs {
    Write-Section "STOPPING BACKGROUND JOBS"
    
    try {
        $runningJobs = Get-Job | Where-Object { $_.State -eq 'Running' }
        
        if ($runningJobs) {
            Write-Status "Found $($runningJobs.Count) running background jobs" "INFO"
            
            foreach ($job in $runningJobs) {
                try {
                    if ($Verbose) {
                        Write-Status "Stopping job: $($job.Name) (ID: $($job.Id))" "INFO"
                    }
                    
                    Stop-Job -Job $job -ErrorAction SilentlyContinue
                    Remove-Job -Job $job -ErrorAction SilentlyContinue
                    Write-Status "✅ Stopped job: $($job.Name)" "SUCCESS"
                } catch {
                    Write-Status "Error stopping job $($job.Id): $($_.Exception.Message)" "WARNING"
                }
            }
        } else {
            Write-Status "No running background jobs found" "INFO"
        }
        
        # Clean up any remaining jobs
        Get-Job | Remove-Job -ErrorAction SilentlyContinue
        Write-Status "✅ All background jobs cleaned up" "SUCCESS"
        
    } catch {
        Write-Status "Error managing background jobs: $($_.Exception.Message)" "ERROR"
    }
}

function Stop-HealthCheckProcesses {
    Write-Section "STOPPING HEALTH CHECK PROCESSES"
    
    try {
        # Find health check related processes
        $healthProcesses = Get-Process | Where-Object {
            $_.ProcessName -match "powershell|pwsh" -and
            $_.CommandLine -match "health-check"
        } -ErrorAction SilentlyContinue
        
        if ($healthProcesses) {
            foreach ($proc in $healthProcesses) {
                try {
                    if ($Force) {
                        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                    } else {
                        $proc.CloseMainWindow()
                        Start-Sleep -Milliseconds 500
                        if (!$proc.HasExited) {
                            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                        }
                    }
                    Write-Status "✅ Stopped health check process (PID: $($proc.Id))" "SUCCESS"
                } catch {
                    Write-Status "Error stopping health check process $($proc.Id): $($_.Exception.Message)" "WARNING"
                }
            }
        } else {
            Write-Status "No health check processes found" "INFO"
        }
        
    } catch {
        Write-Status "Error stopping health check processes: $($_.Exception.Message)" "ERROR"
    }
}

function Clear-DevelopmentResources {
    Write-Section "CLEARING DEVELOPMENT RESOURCES"
    
    # Clear log files (optional)
    try {
        if (Test-Path "logs") {
            $logFiles = Get-ChildItem "logs" -File
            if ($logFiles) {
                Write-Status "Found $($logFiles.Count) log files" "INFO"
                if ($Verbose) {
                    foreach ($logFile in $logFiles) {
                        Write-Status "Log file: $($logFile.Name) ($([math]::Round($logFile.Length/1KB, 2)) KB)" "INFO"
                    }
                }
                # Optionally truncate large log files instead of deleting
                foreach ($logFile in $logFiles) {
                    if ($logFile.Length -gt 10MB) {
                        try {
                            Clear-Content $logFile.FullName
                            Write-Status "✅ Cleared large log file: $($logFile.Name)" "SUCCESS"
                        } catch {
                            Write-Status "Warning: Could not clear $($logFile.Name): $($_.Exception.Message)" "WARNING"
                        }
                    }
                }
            }
        }
    } catch {
        Write-Status "Error managing log files: $($_.Exception.Message)" "WARNING"
    }
    
    # Clear temporary npm/node files
    try {
        $tempPaths = @(
            "$env:TEMP\npm-*",
            "$env:TEMP\yarn-*",
            "$env:TEMP\expo-*"
        )
        
        foreach ($tempPath in $tempPaths) {
            $tempItems = Get-ChildItem $tempPath -ErrorAction SilentlyContinue
            if ($tempItems) {
                foreach ($item in $tempItems) {
                    try {
                        Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
                        if ($Verbose) {
                            Write-Status "Cleared temp: $($item.Name)" "INFO"
                        }
                    } catch {
                        # Ignore temp file cleanup errors
                    }
                }
            }
        }
        Write-Status "✅ Cleared temporary development files" "SUCCESS"
    } catch {
        if ($Verbose) {
            Write-Status "Warning during temp cleanup: $($_.Exception.Message)" "WARNING"
        }
    }
}

function Show-PortStatus {
    Write-Section "PORT STATUS VERIFICATION"
    
    $devPorts = @(3000, 3001, 3002, 8000, 8001, 8002, 8003, 8005, 8080, 8081, 8082, 8090, 9000, 9001, 9090, 19006)
    $busyPorts = @()
    
    foreach ($port in $devPorts) {
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
            if ($connection) {
                $busyPorts += $port
                Write-Status "⚠️  Port $port is still in use" "WARNING"
            } else {
                if ($Verbose) {
                    Write-Status "✅ Port $port is free" "SUCCESS"
                }
            }
        } catch {
            # Port is likely free
        }
    }
    
    if ($busyPorts.Count -eq 0) {
        Write-Status "✅ All development ports are free" "SUCCESS"
    } else {
        Write-Status "⚠️  $($busyPorts.Count) ports still in use: $($busyPorts -join ', ')" "WARNING"
        Write-Status "You may need to manually stop processes on these ports" "INFO"
    }
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Host "🛑 EcoMarket Development Environment Shutdown" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red

if ($Force) {
    Write-Status "🚨 FORCE MODE ENABLED - Immediate termination" "WARNING"
}

if ($KeepVolumes) {
    Write-Status "💾 VOLUME PRESERVATION ENABLED" "INFO"
}

# Execute shutdown sequence
try {
    Stop-BackgroundJobs
    Stop-HealthCheckProcesses  
    Stop-FrontendProcesses -ForceKill:$Force
    Stop-BackendServices
    Clear-DevelopmentResources
    
    # Brief pause to let everything settle
    Start-Sleep -Seconds 2
    
    Show-PortStatus
    
    Write-Section "SHUTDOWN COMPLETE"
    Write-Status "✅ Development environment shutdown completed" "SUCCESS"
    Write-Status "🚀 Ready for next development session" "INFO"
    
} catch {
    Write-Status "❌ Error during shutdown: $($_.Exception.Message)" "ERROR"
    Write-Status "Some manual cleanup may be required" "WARNING"
    exit 1
}

exit 0
