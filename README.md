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
