# Contributing to EcoMarket

Thank you for your interest in contributing to EcoMarket! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Pull Request Process](#pull-request-process)
6. [Code Style Guidelines](#code-style-guidelines)
7. [Testing](#testing)
8. [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Git
- Docker (for local development)

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ecomarket.git
   cd ecomarket
   ```

3. Install dependencies:
   ```bash
   npm install
   ```
   > Run `npm install` after cloning the repository. After that, every `git commit` will automatically execute the configured pre-commit hooks to check your changes.

#### Windows Users - One-Line Setup

For Windows contributors, we provide a convenient PowerShell script that handles the complete development environment setup:

```powershell
.\scripts\install-dev-tools.ps1
```

This script will:
- Install Node.js dependencies
- Create a Python virtual environment and install development requirements
- Set up pre-commit hooks
- Install Go development tools (golangci-lint)

**Note:** Ensure you have Node.js, Python, and Go installed on your system before running this script.

## Making Changes

### Branch Naming Convention

Use descriptive branch names with the following prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Example: `feature/user-authentication`

### Commit Messages

Follow the conventional commit format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting changes
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

Example: `feat(user-service): add email verification`

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Fill out the pull request template
5. Request review from appropriate code owners
6. Address feedback and re-request review
7. Once approved, the PR will be merged by a maintainer

### PR Requirements

- [ ] All CI checks pass
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] CHANGELOG is updated (for significant changes)

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for new code
- Follow Prettier configuration
- Use ESLint rules
- Prefer functional programming patterns
- Use meaningful variable and function names

### Database

- Follow database naming conventions
- Include migrations for schema changes
- Document complex queries

### API Design

- Follow RESTful principles
- Use OpenAPI/Swagger documentation
- Include proper error handling
- Implement rate limiting

## Testing

### Test Structure

```
/services/user-service/
├── src/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests for specific service
npm run test:user-service

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

### Test Guidelines

- Write unit tests for business logic
- Write integration tests for API endpoints
- Include e2e tests for critical user flows
- Aim for 80%+ test coverage
- Use descriptive test names

## Documentation

### Code Documentation

- Document complex functions and classes
- Include JSDoc comments for public APIs
- Keep README files updated
- Document environment variables

### API Documentation

- Use OpenAPI 3.0 specification
- Document all endpoints
- Include request/response examples
- Document error responses

## Architecture Guidelines

### Service Structure

```
/services/{service-name}/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── tests/
├── docs/
├── package.json
└── README.md
```

### Dependency Management

- Keep dependencies up to date
- Use exact versions for production dependencies
- Document why specific dependencies are needed
- Avoid unnecessary dependencies

## Environment Setup

### Local Development

1. Copy environment templates:
   ```bash
   cp .env.example .env.local
   ```

2. Start services:
   ```bash
   npm run dev
   ```

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Create pull request to main
6. Tag release after merge
7. Deploy to staging
8. Deploy to production

## Getting Help

- Check existing issues and discussions
- Join our Slack/Discord channel
- Contact maintainers directly
- Review documentation in `/docs`

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to EcoMarket! 🚀
