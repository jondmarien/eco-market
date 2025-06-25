# Monitoring Infrastructure

This directory contains the monitoring setup for the microservices using Prometheus and Grafana.

## Files Overview

- `prometheus.yml` - Prometheus configuration for scraping Node exporter endpoints
- `docker-compose.monitoring.yml` - Docker Compose file to run the monitoring stack
- `grafana/` - Grafana configuration and dashboards
  - `provisioning/dashboards/dashboard.yml` - Dashboard provisioning config
  - `provisioning/datasources/prometheus.yml` - Prometheus datasource config
  - `dashboards/node-exporter-dashboard.json` - Basic Node exporter dashboard

## Quick Start

### 1. Start the monitoring stack:

```bash
# From the infrastructure directory
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access the services:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Node Exporter**: http://localhost:9100/metrics

### 3. Configure your microservices

To enable monitoring of your microservices, you need to:

1. **Add Node exporter to each service**: Each microservice should expose Node exporter metrics on port 9100
2. **Update service endpoints**: Modify the `prometheus.yml` file to point to the correct service endpoints
3. **Network configuration**: Ensure services are on the same Docker network or accessible via hostnames

## Prometheus Configuration

The `prometheus.yml` includes:

- **Global settings**: 15-second scrape interval
- **prometheus job**: Monitors Prometheus itself
- **node-exporter job**: Monitors the host system
- **microservices-node-exporter job**: Monitors the three microservices
  - user-service:9100
  - order-service:9100
  - product-catalog-service:9100

### Customizing for your environment

#### For Docker Compose deployment:
- Update service hostnames in `prometheus.yml`
- Ensure all services are on the same network

#### For Kubernetes deployment:
- Use service discovery configurations
- Update endpoints to match your K8s services

#### For bare metal deployment:
- Update endpoints to use actual IP addresses or hostnames

## Grafana Dashboards

The setup includes a basic Node Exporter dashboard showing:
- CPU Usage
- Memory Usage
- Disk Usage
- System Load

### Adding more dashboards:

1. Create new dashboard JSON files in `grafana/dashboards/`
2. Restart Grafana container to pick up new dashboards
3. Or import dashboards manually through the Grafana UI

## Monitoring Your Services

### Adding Node Exporter to microservices:

#### Option 1: Sidecar container (Docker Compose)
```yaml
services:
  your-service:
    # your service config
  
  your-service-node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100"
```

#### Option 2: Host Node Exporter
Install Node exporter directly on each host and configure endpoints accordingly.

#### Option 3: Application metrics
For application-specific metrics, integrate Prometheus client libraries in your services.

## Troubleshooting

### Prometheus can't scrape targets:
1. Check if Node exporter is running on target hosts
2. Verify network connectivity between Prometheus and targets
3. Check firewall rules for port 9100

### Grafana shows no data:
1. Verify Prometheus datasource configuration
2. Check if Prometheus is successfully scraping targets
3. Ensure dashboard queries match your metric names

### Services not appearing:
1. Update `prometheus.yml` with correct service endpoints
2. Restart Prometheus container after config changes
3. Check Prometheus logs for configuration errors

## Next Steps

1. **Add alerting**: Configure Alertmanager for notifications
2. **Custom metrics**: Add application-specific metrics to your services
3. **More dashboards**: Import community dashboards from Grafana.com
4. **Security**: Configure authentication and HTTPS for production
5. **Scaling**: Consider Prometheus federation for multiple clusters
