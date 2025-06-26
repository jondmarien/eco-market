# API Documentation Access Guide

## Swagger/OpenAPI URLs

### Current Services

#### User Service

- **Swagger UI**: `http://localhost:4000/api-docs`
- **OpenAPI JSON**: `http://localhost:4000/api-docs.json`
- **Port**: 4000
- **Status**: Active

#### Product Catalog Service

- **Swagger UI**: `http://localhost:3001/docs`
- **ReDoc**: `http://localhost:3001/redoc`
- **OpenAPI JSON**: `http://localhost:3001/openapi.json`
- **Port**: 3001 (assumed)
- **Status**: Active

#### Inventory Service

- **Swagger UI**: `http://localhost:3002/docs`
- **OpenAPI JSON**: `http://localhost:3002/openapi.json`
- **Port**: 3002 (assumed)
- **Status**: Active

#### Order Service

- **Swagger UI**: `http://localhost:3003/swagger` (future)
- **OpenAPI JSON**: `http://localhost:3003/api-docs.json` (future)
- **Port**: 3003 (assumed)
- **Status**: Planned

### Production URLs

Replace `localhost` with your production domain:

- User Service: `https://api.yourdomain.com/user/api-docs`
- Product Catalog: `https://api.yourdomain.com/catalog/docs`
- Inventory: `https://api.yourdomain.com/inventory/docs`
- Order Service: `https://api.yourdomain.com/orders/swagger`

## How to Regenerate OpenAPI Specs

### 1. Node.js/Express Applications

#### Using swagger-jsdoc and swagger-ui-express

```javascript
// Install dependencies
npm install swagger-jsdoc swagger-ui-express

// app.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'API documentation for User Service',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to API files
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Export OpenAPI JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});
```

#### Regeneration Commands

```bash
# Restart the application to regenerate specs
npm run dev

# Or use nodemon for auto-restart
npm install -g nodemon
nodemon app.js
```

### 2. Python/FastAPI Applications

FastAPI automatically generates OpenAPI specs:

```python
from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="Product Catalog API",
    description="API for product catalog management",
    version="1.0.0"
)

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Product Catalog API",
        version="1.0.0",
        description="API for product catalog management",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

#### Regeneration Commands

```bash
# Restart FastAPI application
uvicorn main:app --reload --port 3001

# Export OpenAPI JSON
curl http://localhost:3001/openapi.json > openapi.json
```

### 3. Java/Spring Boot Applications

#### Using SpringDoc OpenAPI

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.0.2</version>
</dependency>
```

```java
// OpenAPIConfig.java
@Configuration
public class OpenAPIConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Inventory Service API")
                .version("1.0.0")
                .description("API documentation for Inventory Service"));
    }
}
```

#### Regeneration Commands

```bash
# Rebuild and restart Spring Boot application
./mvnw spring-boot:run

# Or with Gradle
./gradlew bootRun
```

### 4. Manual OpenAPI Spec Creation

Create a `openapi.yaml` file:

```yaml
openapi: 3.0.0
info:
  title: Order Service API
  version: 1.0.0
  description: API for order management
servers:
  - url: http://localhost:3003
    description: Development server
paths:
  /orders:
    get:
      summary: Get all orders
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Order'
components:
  schemas:
    Order:
      type: object
      properties:
        id:
          type: string
        customerId:
          type: string
        status:
          type: string
```

## Automation and CI/CD Integration

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/api-docs.yml
name: Generate API Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Generate OpenAPI specs
        run: |
          npm run start &
          sleep 10
          curl http://localhost:4000/api-docs.json > docs/user-service-api.json
          
      - name: Upload API docs
        uses: actions/upload-artifact@v2
        with:
          name: api-documentation
          path: docs/
```

### 2. Docker Integration

```dockerfile
# Dockerfile for API documentation
FROM nginx:alpine

# Copy generated OpenAPI specs
COPY docs/ /usr/share/nginx/html/docs/

# Copy swagger-ui
RUN wget https://github.com/swagger-api/swagger-ui/archive/refs/tags/v4.15.5.tar.gz \
    && tar -xzf v4.15.5.tar.gz \
    && cp -r swagger-ui-4.15.5/dist/* /usr/share/nginx/html/

EXPOSE 80
```

### 3. Script for Bulk Regeneration

```bash
#!/bin/bash
# regenerate-api-docs.sh

echo "Regenerating API documentation for all services..."

# User Service
echo "Starting User Service..."
cd user-service
npm install
npm run start &
USER_PID=$!
sleep 10
curl http://localhost:4000/api-docs.json > ../docs/user-service-api.json
kill $USER_PID
cd ..

# Product Catalog Service
echo "Starting Product Catalog Service..."
cd product-catalog-service
pip install -r requirements.txt
uvicorn main:app --port 3001 &
CATALOG_PID=$!
sleep 10
curl http://localhost:3001/openapi.json > ../docs/product-catalog-api.json
kill $CATALOG_PID
cd ..

# Inventory Service
echo "Starting Inventory Service..."
cd inventory-service
pip install -r requirements.txt
uvicorn main:app --port 3002 &
INVENTORY_PID=$!
sleep 10
curl http://localhost:3002/openapi.json > ../docs/inventory-api.json
kill $INVENTORY_PID
cd ..

echo "API documentation regeneration complete!"
```

## Best Practices

### 1. Documentation Standards

- Use consistent naming conventions
- Include comprehensive descriptions
- Provide example requests/responses
- Document error codes and responses
- Include authentication requirements

### 2. Version Management

- Use semantic versioning for APIs
- Maintain backward compatibility
- Document breaking changes
- Provide migration guides

### 3. Automation

- Set up CI/CD pipelines for documentation
- Automate spec generation on code changes
- Validate OpenAPI specs in pipeline
- Deploy documentation to staging/production

### 4. Monitoring and Maintenance

- Regular reviews of API documentation
- Monitor documentation usage
- Keep examples up-to-date
- Gather feedback from API consumers

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure each service runs on a unique port
2. **CORS Issues**: Configure CORS for cross-origin documentation access
3. **Authentication**: Handle authentication in Swagger UI
4. **Schema Validation**: Validate OpenAPI specs before deployment

### Validation Commands

```bash
# Install swagger-codegen for validation
npm install -g swagger-codegen-cli

# Validate OpenAPI spec
swagger-codegen-cli validate -i openapi.json

# Or use online validator
curl -X POST "https://validator.swagger.io/validator/debug" \
     -H "Content-Type: application/json" \
     -d @openapi.json
```

## Quick Reference

| Service | Port | Swagger URL | OpenAPI JSON |
|---------|------|-------------|--------------|
| User Service | 4000 | `/api-docs` | `/api-docs.json` |
| Product Catalog | 3001 | `/docs` | `/openapi.json` |
| Inventory | 3002 | `/docs` | `/openapi.json` |
| Order Service | 3003 | `/swagger` (future) | `/api-docs.json` (future) |

For production deployments, replace `localhost` with your actual domain and adjust ports as needed.
