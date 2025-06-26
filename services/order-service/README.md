# Order Management Service

A robust Go-based microservice for managing e-commerce orders with Redis caching and PostgreSQL persistence.

## Features

- **Complete Order Management**: Create, read, update, and track orders
- **Redis Caching**: Fast order retrieval with automatic cache management
- **PostgreSQL Storage**: Reliable data persistence with ACID transactions
- **Status Management**: Order status transitions with business rule validation
- **RESTful API**: Clean HTTP endpoints with JSON responses
- **Graceful Shutdown**: Proper cleanup and resource management
- **Docker Support**: Containerized deployment with docker-compose

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP Client   │───▶│   Order API     │───▶│  Order Service  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                               ┌────────────────────────┼────────────────────────┐
                               ▼                        ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
                       │   Repository    │───▶│   PostgreSQL    │    │      Redis      │
                       └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Order Status Flow

```
pending → confirmed → processing → shipped → delivered
   │         │           │
   ▼         ▼           ▼
cancelled  cancelled  cancelled
   │
   ▼
refunded (from delivered)
```

## API Endpoints

### Order Management
- `POST /api/v1/orders` - Create a new order
- `GET /api/v1/orders?user_id={uuid}&page=1&limit=20` - Get orders for a user
- `GET /api/v1/orders/{id}` - Get a specific order
- `PATCH /api/v1/orders/{id}/status` - Update order status
- `POST /api/v1/orders/{id}/cancel` - Cancel an order

### Admin Endpoints
- `GET /api/v1/admin/orders/stats` - Get order statistics

### Health Check
- `GET /api/v1/health` - Service health status

## Data Models

### Order
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "status": "pending|confirmed|processing|shipped|delivered|cancelled|refunded",
  "items": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 49.99,
      "total_price": 99.98
    }
  ],
  "total_amount": 99.98,
  "currency": "USD",
  "shipping_address": {
    "street": "123 Main St",
    "city": "Seattle",
    "state": "WA",
    "postal_code": "98101",
    "country": "USA"
  },
  "billing_address": {
    "street": "123 Main St",
    "city": "Seattle",
    "state": "WA",
    "postal_code": "98101",
    "country": "USA"
  },
  "created_at": "2023-12-07T10:00:00Z",
  "updated_at": "2023-12-07T10:00:00Z"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `POSTGRESQL_URL` | PostgreSQL connection string | `postgres://user:password@localhost:5432/orders?sslmode=disable` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `ENVIRONMENT` | Environment mode | `development` |

## Quick Start

### Using Docker Compose (Recommended)

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Check service health**:
   ```bash
   curl http://localhost:8003/api/v1/health
   ```

3. **Create an order**:
   ```bash
   curl -X POST http://localhost:8003/api/v1/orders \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "123e4567-e89b-12d3-a456-426614174000",
       "items": [
         {
           "product_id": "234e5678-e89b-12d3-a456-426614174001",
           "quantity": 2,
           "unit_price": 29.99
         }
       ],
       "currency": "USD",
       "shipping_address": {
         "street": "123 Main St",
         "city": "Seattle",
         "state": "WA",
         "postal_code": "98101",
         "country": "USA"
       },
       "billing_address": {
         "street": "123 Main St",
         "city": "Seattle",
         "state": "WA",
         "postal_code": "98101",
         "country": "USA"
       }
     }'
   ```

### Manual Setup

1. **Install dependencies**:
   ```bash
   go mod download
   ```

2. **Set up environment variables**:
   ```bash
   export POSTGRESQL_URL="postgres://orders_user:orders_password@localhost:5432/orders_db?sslmode=disable"
   export REDIS_URL="redis://localhost:6379"
   export PORT="8080"
   ```

3. **Run the service**:
   ```bash
   go run cmd/server/main.go
   ```

## Development

### Project Structure
```
order-service/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go            # Configuration management
│   ├── database/
│   │   ├── connections.go       # Database connections
│   │   └── schema.sql           # Database schema
│   ├── handlers/
│   │   └── order.go             # HTTP handlers
│   ├── models/
│   │   └── order.go             # Data models
│   ├── repository/
│   │   └── order_repository.go  # Data access layer
│   └── service/
│       └── order_service.go     # Business logic
├── docker-compose.yml           # Development environment
├── Dockerfile                   # Container image
├── go.mod                       # Go dependencies
├── go.sum                       # Dependency checksums
├── init.sql                     # Database initialization
└── README.md                    # This file
```

### Running Tests
```bash
go test ./...
```

### Building
```bash
go build -o order-service ./cmd/server
```

## Business Rules

### Order Creation
- Orders must contain at least one item
- Item quantities must be positive
- Unit prices cannot be negative
- Total amount is automatically calculated

### Status Transitions
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `processing`, `cancelled`
- `processing` → `shipped`, `cancelled`
- `shipped` → `delivered`
- `delivered` → `refunded`
- `cancelled` and `refunded` are terminal states

### Order Cancellation
- Orders can only be cancelled in `pending`, `confirmed`, or `processing` states
- Cancelled orders cannot be modified

## Monitoring

### Health Check
The service provides a health check endpoint at `/api/v1/health`.

### Metrics
- Redis cache hit/miss rates
- Database query performance
- Order processing times
- Status transition metrics

### Logging
Structured logging with different levels:
- `INFO`: General application flow
- `WARN`: Recoverable errors
- `ERROR`: Application errors
- `DEBUG`: Detailed debugging information

## Database Schema

The service uses PostgreSQL with the following tables:

- **orders**: Main order information
- **order_items**: Individual items within orders

Both tables use UUID primary keys and include timestamps for audit trails.

## Caching Strategy

- **Cache Key Format**: `order:{order_id}`
- **TTL**: 30 minutes
- **Cache Invalidation**: Automatic on order updates
- **Fallback**: Database queries on cache miss

## Error Handling

The service provides detailed error responses:

```json
{
  "error": "Order not found"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## Contributing

1. Follow Go coding standards
2. Add tests for new functionality
3. Update documentation
4. Ensure Docker builds succeed

## License

This service is part of the EcoMarket platform.
