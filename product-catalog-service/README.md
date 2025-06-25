# EcoMarket Product Catalog Service

A comprehensive product catalog microservice built with FastAPI and PostgreSQL, featuring advanced search capabilities and RESTful APIs for managing products and categories.

## 🚀 Features

- **Product Management**: Full CRUD operations for products with rich metadata
- **Category Management**: Hierarchical category system with parent-child relationships
- **Advanced Search**: Full-text search with filtering by price, brand, eco-rating, and more
- **Inventory Tracking**: Stock quantity management and low-stock alerts
- **Eco-Friendly Focus**: Built-in sustainability ratings and eco-friendly product features
- **RESTful API**: Well-documented REST endpoints with OpenAPI/Swagger documentation
- **Database Optimization**: Indexed fields for fast queries and efficient pagination
- **Containerized**: Docker and Docker Compose ready for easy deployment

## 🛠️ Technology Stack

- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Validation**: Pydantic models for request/response validation
- **Authentication**: Ready for JWT token integration
- **Documentation**: Auto-generated OpenAPI/Swagger docs
- **Containerization**: Docker and Docker Compose
- **Testing**: pytest with async support

## 📦 Installation & Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd product-catalog-service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Set up database**
   ```bash
   # Ensure PostgreSQL is running and create database
   createdb product_catalog
   ```

6. **Run the application**
   ```bash
   uvicorn app.main:app --reload
   ```

### Docker Setup

1. **Using Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```

2. **Using Docker only**
   ```bash
   docker build -t product-catalog-service .
   docker run -p 8000:8000 product-catalog-service
   ```

## 📖 API Documentation

Once running, access the interactive API documentation at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Products
- `GET /api/v1/products/` - List products with search and filtering
- `POST /api/v1/products/` - Create a new product
- `GET /api/v1/products/{id}` - Get product by ID
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Soft delete product
- `GET /api/v1/products/featured` - Get featured products
- `GET /api/v1/products/low-stock` - Get low stock products
- `GET /api/v1/products/search/suggestions` - Get search suggestions

#### Categories
- `GET /api/v1/categories/` - List categories
- `POST /api/v1/categories/` - Create category
- `GET /api/v1/categories/{id}` - Get category by ID
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Soft delete category

#### Service
- `GET /` - Service information
- `GET /health` - Health check
- `GET /api/v1/stats` - Service statistics

## 🔍 Search & Filtering

The product search API supports comprehensive filtering:

```http
GET /api/v1/products/?q=organic&category_id=1&min_price=10&max_price=100&eco_rating=5&is_featured=true&sort_by=price&sort_order=asc
```

**Available Filters:**
- `q` - Text search (name, description, brand, tags)
- `category_id` - Filter by category
- `min_price`, `max_price` - Price range
- `brand` - Brand name filter
- `eco_rating` - Sustainability rating (1-5)
- `is_featured` - Featured products only
- `tags` - Filter by product tags
- `sort_by` - Sort field (price, name, created_at, etc.)
- `sort_order` - Sort direction (asc/desc)

## 📊 Database Schema

### Products Table
- `id` - Primary key
- `name` - Product name (indexed)
- `description` - Product description
- `price` - Product price
- `sku` - Stock Keeping Unit (unique, indexed)
- `stock_quantity` - Available inventory
- `category_id` - Foreign key to categories
- `image_url` - Product image URL
- `tags` - Array of searchable tags
- `is_active` - Soft delete flag
- `is_featured` - Featured product flag
- `weight` - Product weight in kg
- `dimensions` - Product dimensions
- `brand` - Product brand
- `eco_rating` - Sustainability rating (1-5)
- `created_at`, `updated_at` - Timestamps

### Categories Table
- `id` - Primary key
- `name` - Category name (unique, indexed)
- `description` - Category description
- `parent_id` - Self-referencing foreign key for hierarchy
- `is_active` - Soft delete flag
- `created_at`, `updated_at` - Timestamps

## 🧪 Testing

Run tests with:

```bash
pytest
```

Run tests with coverage:

```bash
pytest --cov=app --cov-report=html
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set production values in `.env`
2. **Database**: Use managed PostgreSQL service
3. **Security**: Implement authentication and authorization
4. **Monitoring**: Add logging, metrics, and health checks
5. **Caching**: Implement Redis for frequently accessed data
6. **Search**: Consider Elasticsearch for advanced search features

### Docker Production

```dockerfile
# Use multi-stage build for production
FROM python:3.11-slim as production
# ... optimized production configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_SERVER` | PostgreSQL server host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `product_catalog` |
| `POSTGRES_USER` | Database user | `ecomarket` |
| `POSTGRES_PASSWORD` | Database password | `password` |

## 📈 Performance

- **Database Indexes**: Optimized queries with strategic indexing
- **Pagination**: Efficient offset-based pagination
- **Connection Pooling**: SQLAlchemy connection pooling
- **Async Support**: FastAPI async capabilities for high concurrency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛟 Support

- **Documentation**: [API Docs](http://localhost:8000/docs)
- **Issues**: [GitHub Issues](https://github.com/your-org/product-catalog-service/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/product-catalog-service/discussions)

---

**Built with ❤️ for sustainable e-commerce**
