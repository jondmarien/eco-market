# =============================================================================
# Service Endpoints Configuration
# =============================================================================
# This file defines the health check endpoints for all backend services.
# It's shared between health-check-services.ps1 and dev.ps1 to maintain
# consistency and avoid port drift issues.

function Get-ServiceEndpoints {
    param([hashtable]$EnvVars = @{})
    
    # Default ports (can be overridden by .env file)
    $defaultPorts = @{
        "USER_SERVICE_PORT" = "8001"
        "PAYMENT_SERVICE_PORT" = "7000" 
        "ORDER_SERVICE_PORT" = "8003"
        "PRODUCT_SERVICE_PORT" = "8000"
        "INVENTORY_SERVICE_PORT" = "8005"
        "ANALYTICS_SERVICE_PORT" = "9000"
        "NOTIFICATION_SERVICE_PORT" = "9001"
    }
    
    # Merge with environment variables (env vars take precedence)
    $ports = $defaultPorts.Clone()
    foreach ($key in $defaultPorts.Keys) {
        if ($EnvVars.ContainsKey($key)) {
            $ports[$key] = $EnvVars[$key]
        }
    }
    
    # Define service health check endpoints
    $serviceEndpoints = @{
        "user-service"        = "http://localhost:$($ports.USER_SERVICE_PORT)/api/v1/health"
        "payment-service"     = "http://localhost:$($ports.PAYMENT_SERVICE_PORT)/api/v1/health"
        "order-service"       = "http://localhost:$($ports.ORDER_SERVICE_PORT)/api/v1/health"
        "product-catalog"     = "http://localhost:$($ports.PRODUCT_SERVICE_PORT)/docs"
        "inventory-service"   = "http://localhost:$($ports.INVENTORY_SERVICE_PORT)/api/v1/health"
        "analytics-service"   = "http://localhost:$($ports.ANALYTICS_SERVICE_PORT)/health/"
        "notification-service"= "http://localhost:$($ports.NOTIFICATION_SERVICE_PORT)/api/v1/health"
    }
    
    return $serviceEndpoints
}

function Get-EnvVariables {
    param([string]$EnvFilePath = ".env")
    
    $envVars = @{}
    
    if (Test-Path $EnvFilePath) {
        Get-Content $EnvFilePath | ForEach-Object {
            if ($_ -match "^([^#][^=]*)=(.*)$") {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                $envVars[$name] = $value
            }
        }
    }
    
    return $envVars
}

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$TimeoutSec = 5
    )
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec $TimeoutSec -ErrorAction Stop
        
        # Handle different response types for different services
        if ($ServiceName -eq "order-service" -and $response.status) {
            return @{
                Success = ($response.status -eq "healthy")
                Message = "Status: $($response.status)"
            }
        } elseif ($ServiceName -eq "product-catalog") {
            # For docs endpoint, just check if we get a response
            return @{
                Success = $true
                Message = "Docs endpoint accessible"
            }
        } else {
            # Generic health check
            return @{
                Success = $true
                Message = "Health check passed"
            }
        }
    } catch {
        return @{
            Success = $false
            Message = $_.Exception.Message
        }
    }
}
