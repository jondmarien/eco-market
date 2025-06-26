# EcoMarket

[![Quick Start](https://img.shields.io/badge/Quick%20Start-Get%20Started-brightgreen?style=for-the-badge)](docs/dev-environment.md)

EcoMarket is a sustainable e-commerce platform built with a microservices architecture. This mono-repository contains all services, shared libraries, and infrastructure configurations.

## 🚀 Quick Start

Get up and running with the EcoMarket development environment in minutes:

```powershell
# 1. Clone the repository
git clone <repository-url>
cd ISSessionsWarp2.0Demo

# 2. Set up environment variables
cp .env.template .env
# Edit .env with your configuration

# 3. Start the development stack
.\scripts\up.ps1
```

For detailed setup instructions, see [Development Environment Setup](docs/dev-environment.md).

## 📁 Project Structure

```
ecomarket/
├── docs/                    # Documentation
├── infrastructure/          # Docker, monitoring, and deployment configs
├── scripts/                # Development and deployment scripts
├── agent-tasks/            # Project management and task tracking
└── [services/]             # Microservices (to be implemented)
```

## 🛠️ Development

### Prerequisites

- Docker Desktop
- PowerShell (Windows PowerShell or PowerShell Core)
- Node.js (for future frontend development)

### Environment Setup

1. **Environment Variables**: Copy `.env.template` to `.env` and configure your settings
2. **Docker**: Ensure Docker Desktop is running
3. **Start Services**: Run `.\scripts\up.ps1` to start the development stack

### Available Scripts

- `.\scripts\up.ps1` - Start the development environment

## 📖 Documentation

- [Development Environment Setup](docs/dev-environment.md) - Complete setup guide
- [Repository Strategy](docs/repository-strategy.md) - Mono-repo approach and rationale

## 🏗️ Architecture

EcoMarket follows a microservices architecture with the following planned services:

- **User Service** - User management and authentication
- **Product Catalog Service** - Product information and catalog
- **Order Service** - Order processing and management
- **Customer Web** - Customer-facing web application

## 🧪 Testing

EcoMarket uses a comprehensive testing strategy with language-specific test frameworks for each service.

### Running Tests by Service

#### User Service (Node.js + Jest)
```bash
# Navigate to User Service
cd services/user-service

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Python Services (Analytics & Notification Services)
```bash
# Navigate to Python service directory
cd services/analytics-service  # or services/notification-service

# Run all tests
pytest

# Run tests with verbose output
pytest -v

# Run tests with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_analytics.py
```

#### Order Service (Go)
```bash
# Navigate to Order Service
cd services/order-service

# Run all tests
go test ./...

# Run tests with verbose output
go test -v ./...

# Run tests with coverage
go test -cover ./...

# Generate detailed coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

#### Product Catalog Service (Language TBD)
```bash
# Navigate to Product Catalog Service
cd product-catalog-service

# Commands will be updated based on chosen technology stack
# Placeholder for future implementation
```

### System-Level Tests

```bash
# Integration tests across all services
# 🚧 To be implemented
./scripts/test-integration.ps1

# End-to-end tests
# 🚧 To be implemented  
./scripts/test-e2e.ps1

# Performance tests
# 🚧 To be implemented
./scripts/test-performance.ps1
```

### Coverage Commands Summary

| Service | Framework | Test Command | Coverage Command |
|---------|-----------|--------------|------------------|
| User Service | Jest | `npm test` | `npm run test:coverage` |
| Analytics Service | pytest | `pytest` | `pytest --cov=. --cov-report=html` |
| Notification Service | pytest | `pytest` | `pytest --cov=. --cov-report=html` |
| Order Service | Go testing | `go test ./...` | `go test -cover ./...` |
| Product Catalog | TBD | TBD | TBD |

### Test Structure

Each service follows language-specific testing conventions:

- **Node.js Services**: Tests in `__tests__/` or `tests/` directories using Jest
- **Python Services**: Tests in `tests/` directory using pytest
- **Go Services**: Tests alongside source files with `_test.go` suffix

### Running All Tests

```bash
# Run tests for all services
# 🚧 To be implemented
./scripts/test-all.ps1

# Generate combined coverage report
# 🚧 To be implemented
./scripts/coverage-all.ps1
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🚦 Project Status

🚧 **In Development** - EcoMarket is currently in active development. Core services and infrastructure are being built.

---

For questions or support, please refer to the documentation or create an issue.
