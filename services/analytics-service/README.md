# EcoMarket Analytics Service

A comprehensive analytics microservice providing insights into sales, user behavior, and business performance for the EcoMarket e-commerce platform.

## Features

### 📊 Core Analytics Capabilities
- **Event Tracking**: User behavior, product interactions, and order lifecycle events
- **Real-time Metrics**: Live dashboard with instant analytics updates
- **Comprehensive Reporting**: Sales, user behavior, and product performance reports
- **Data Visualization**: Interactive charts and graphs using Plotly
- **Aggregated Metrics**: Daily, weekly, and monthly metric calculations
- **Performance Monitoring**: Service health checks and monitoring endpoints

### 🎯 Analytics Categories

#### User Analytics
- Page views and user sessions
- User registration and login tracking
- Shopping cart behavior analysis
- User journey mapping
- Session duration and engagement metrics

#### Product Analytics
- Product view tracking
- Cart addition/removal events
- Purchase conversion rates
- Product recommendation effectiveness
- Search behavior analysis

#### Sales Analytics
- Revenue tracking and trends
- Order lifecycle monitoring
- Payment method analysis
- Average order value calculations
- Sales performance by time period

#### Business Intelligence
- Customer acquisition metrics
- Retention rate analysis
- Revenue growth tracking
- Product performance insights
- Market trend identification

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 13+
- Redis 6+
- Django 4.2+

### Installation

1. **Clone and setup the project**:
```bash
cd services/analytics-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your database and service configurations
```

3. **Set up the database**:
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

4. **Start the development server**:
```bash
python manage.py runserver 8000
```

5. **Start Celery worker (in another terminal)**:
```bash
celery -A analytics worker -l info
```

6. **Start Celery beat scheduler (in another terminal)**:
```bash
celery -A analytics beat -l info
```

The service will be available at `http://localhost:8000`

## API Documentation

### Base URL
```
http://localhost:8000/api/v1/
```

### Core Endpoints

#### Health Check
```http
GET /health/
```
Returns service health status and dependency checks.

#### Data Collection
```http
POST /api/v1/core/collect/
Content-Type: application/json
Authorization: Bearer <token>

{
  "category": "user",
  "event_type": "page_view",
  "user_id": "user123",
  "session_id": "session456",
  "data": {
    "page_url": "/products/123",
    "page_title": "Eco-Friendly Water Bottle"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

#### Overview Metrics
```http
GET /api/v1/core/metrics/overview/?days=30
Authorization: Bearer <token>
```

#### Sales Reports
```http
GET /api/v1/reports/sales/?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

#### User Behavior Reports
```http
GET /api/v1/reports/user-behavior/?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

### Event Categories

#### User Events
```json
{
  "category": "user",
  "event_type": "page_view|product_view|search|add_to_cart|checkout_start|checkout_complete|login|registration",
  "user_id": "string",
  "session_id": "string",
  "data": {}
}
```

#### Product Events
```json
{
  "category": "product",
  "event_type": "view|purchase|cart_add|cart_remove|wishlist_add|review",
  "product_id": "string",
  "user_id": "string",
  "quantity": 1,
  "price": 29.99,
  "data": {}
}
```

#### Order Events
```json
{
  "category": "order",
  "event_type": "created|payment_started|payment_completed|confirmed|shipped|delivered|cancelled",
  "order_id": "string",
  "user_id": "string",
  "order_total": 99.99,
  "items_count": 3,
  "payment_method": "credit_card",
  "data": {}
}
```

## Data Models

### Event Storage
- **UserEvent**: User behavior tracking
- **ProductEvent**: Product interaction tracking
- **OrderEvent**: Order lifecycle tracking
- **SalesMetric**: Aggregated sales data

### Analytics Features
- **Real-time event processing**
- **Batch data aggregation**
- **Caching for performance**
- **Data retention policies**

## Architecture

### Service Structure
```
analytics/
├── apps/
│   ├── core/           # Core functionality and health checks
│   ├── events/         # Event processing and storage
│   ├── reporting/      # Report generation and analytics
│   └── dashboards/     # Real-time dashboard APIs
├── static/             # Static files
├── templates/          # Django templates
└── logs/              # Application logs
```

### Technology Stack
- **Backend**: Django 4.2 with Django REST Framework
- **Database**: PostgreSQL with optimized indexes
- **Cache**: Redis for real-time metrics and caching
- **Task Queue**: Celery with Redis broker
- **Visualization**: Plotly for charts and graphs
- **Analytics**: Pandas and NumPy for data processing

### Real-time Features
- **WebSocket support** via Django Channels
- **Live dashboard updates**
- **Real-time event processing**
- **Instant metric calculations**

## Integration with Other Services

### Event Collection
The analytics service collects events from all EcoMarket microservices:

```javascript
// Example: From the frontend
fetch('http://analytics-service:8000/api/v1/core/collect/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    category: 'user',
    event_type: 'product_view',
    user_id: currentUser.id,
    session_id: sessionId,
    data: {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price: product.price
    }
  })
});
```

### Service Integration
```python
# Example: From Order Service
import requests

def track_order_event(order_id, event_type, order_data):
    analytics_data = {
        'category': 'order',
        'event_type': event_type,
        'order_id': order_id,
        'user_id': order_data['user_id'],
        'order_total': order_data['total'],
        'items_count': len(order_data['items']),
        'payment_method': order_data['payment_method'],
        'data': order_data
    }
    
    requests.post(
        'http://analytics-service:8000/api/v1/core/collect/',
        json=analytics_data,
        headers={'Authorization': f'Bearer {service_token}'}
    )
```

## Performance Optimizations

### Database Optimization
- **Optimized indexes** on frequently queried fields
- **Database partitioning** for large event tables
- **Query optimization** with select_related and prefetch_related
- **Connection pooling** for better performance

### Caching Strategy
- **Redis caching** for frequently accessed data
- **Query result caching** for expensive operations
- **Real-time metrics caching** with TTL
- **Template fragment caching** for dashboard components

### Scalability
- **Horizontal scaling** with multiple worker instances
- **Database read replicas** for analytics queries
- **Celery workers** for background processing
- **Load balancing** for high availability

## Monitoring and Alerting

### Health Checks
- Database connectivity monitoring
- Redis cache health checks
- External service dependency checks
- Application performance metrics

### Metrics Collection
- Response time monitoring
- Error rate tracking
- Event processing rates
- Database query performance

### Alerting
- Failed event processing alerts
- Service dependency failures
- Performance degradation warnings
- Data integrity checks

## Security

### Authentication & Authorization
- JWT token-based authentication
- Service-to-service authentication
- Role-based access control
- API rate limiting

### Data Protection
- Sensitive data anonymization
- GDPR compliance features
- Data retention policies
- Secure data transmission

## Development

### Running Tests
```bash
python manage.py test
```

### Code Quality
```bash
# Linting
flake8 analytics/
black analytics/

# Type checking
mypy analytics/
```

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t ecomarket-analytics .

# Run container
docker run -p 8000:8000 --env-file .env ecomarket-analytics
```

### Production Configuration
- Set `DEBUG=False`
- Configure proper database connections
- Set up Redis cluster for high availability
- Configure logging and monitoring
- Set up SSL/TLS encryption

### Environment Variables
See `.env.example` for all required configuration options.

## API Examples

### Track User Registration
```bash
curl -X POST http://localhost:8000/api/v1/core/collect/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "category": "user",
    "event_type": "registration",
    "user_id": "user123",
    "session_id": "session456",
    "data": {
      "registration_method": "email",
      "user_agent": "Mozilla/5.0...",
      "referrer": "https://google.com"
    }
  }'
```

### Get Sales Overview
```bash
curl -X GET "http://localhost:8000/api/v1/core/metrics/overview/?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Generate Sales Report
```bash
curl -X GET "http://localhost:8000/api/v1/reports/sales/?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is part of the EcoMarket platform and is proprietary software.

## Support

For technical support or questions:
- Create an issue in the project repository
- Contact the development team
- Check the API documentation at `/api/docs/`
