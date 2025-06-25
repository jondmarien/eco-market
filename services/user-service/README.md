# User Service

The User Service handles user authentication, registration, and profile management for the EcoMarket platform.

## Features

- ✅ User registration and login
- ✅ JWT-based authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Account lockout protection against brute force attacks
- ✅ Password reset functionality
- ✅ User profile management
- ✅ Role-based access control (Customer, Vendor, Admin, Super Admin)
- ✅ Sustainability preferences tracking
- ✅ Input validation and sanitization
- ✅ Rate limiting and security middleware

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS, Rate limiting

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | User login | Public |
| POST | `/refresh` | Refresh access token | Public |
| GET | `/me` | Get current user profile | Private |
| POST | `/logout` | Logout user | Private |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password/:token` | Reset password | Public |

### User Management Routes (`/api/v1/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all users (paginated) | Admin |
| GET | `/:id` | Get single user | Private/Admin |
| PUT | `/:id` | Update user profile | Private/Admin |
| DELETE | `/:id` | Deactivate user account | Private/Admin |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/health` | Service health status | Public |

## Environment Variables

Create a `.env` file in the user-service directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ecomarket_users

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_REFRESH_EXPIRE=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB running locally or connection string
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Run the service:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Using Docker

1. Build the image:
```bash
docker build -t user-service .
```

2. Run the container:
```bash
docker run -p 4000:4000 --env-file .env user-service
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Development

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Project Structure

```
src/
├── controllers/     # Request handlers
│   └── authController.js
├── middleware/      # Custom middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── requestLogger.js
├── models/          # Database models
│   └── User.js
├── routes/          # API routes
│   ├── authRoutes.js
│   └── userRoutes.js
├── utils/          # Utility functions
└── server.js       # Main application file
tests/              # Test files
```

## Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **Account Protection**: Lockout after failed login attempts
- **JWT Security**: Separate access and refresh tokens
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against DDoS and brute force attacks
- **CORS Configuration**: Controlled cross-origin requests
- **Security Headers**: Helmet.js for security headers

## User Roles

- **Customer**: Basic user with shopping capabilities
- **Vendor**: Can manage their products and orders
- **Admin**: Can manage users and platform settings
- **Super Admin**: Full system access

## Sustainability Features

Users can set sustainability preferences:
- Carbon neutral products only
- Organic products only
- Local products only
- Maximum carbon footprint threshold

## Error Handling

The service uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Submit a pull request

## Health Check

Check service health at `/health`:

```json
{
  "status": "healthy",
  "service": "user-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```
