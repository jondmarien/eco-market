# Frontend Setup Guide

This section covers the setup and configuration of the frontend applications in the EcoMarket platform.

## Overview

The EcoMarket platform includes two main frontend applications:

- **Customer Web** (Next.js 15 with TypeScript) - Port 3000
- **Admin Dashboard** (Create React App with TypeScript) - Port 3001

Both applications use Tailwind CSS for styling and connect to backend services during local development.

## Customer Web (Next.js)

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

Navigate to the customer web directory and install dependencies:

```bash
cd frontend/customer-web
npm install
```

### Environment Variables

Create a `.env.local` file in the `frontend/customer-web` directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:8002
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:8003
NEXT_PUBLIC_PAYMENT_SERVICE_URL=http://localhost:8004

# Authentication
NEXT_PUBLIC_AUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PAYMENTS=true
```

### Development Server

Start the development server with Turbopack:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Configuration Details

#### Next.js Configuration

The Next.js configuration is minimal and uses default settings:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for development
  experimental: {
    turbo: {
      // Turbopack configuration can be added here
    }
  },
  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/api/users/:path*',
        destination: 'http://localhost:8001/api/:path*',
      },
      {
        source: '/api/products/:path*',
        destination: 'http://localhost:8002/api/:path*',
      },
      {
        source: '/api/orders/:path*',
        destination: 'http://localhost:8003/api/:path*',
      },
      {
        source: '/api/payments/:path*',
        destination: 'http://localhost:8004/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

#### Tailwind CSS Configuration

The customer web app uses Tailwind CSS 4.x with custom color schemes:

- **Eco Theme**: Green color palette for environmental focus
- **Earth Theme**: Brown/yellow earth tones
- **Ocean Theme**: Blue color palette
- **Custom Components**: Card, button, and form components

### Scripts

Available npm scripts:

```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Dependencies

Key dependencies include:

- **Framework**: Next.js 15.3.4
- **React**: 19.0.0
- **Styling**: Tailwind CSS 4.1.10
- **Forms**: React Hook Form 7.58.1 with Zod validation
- **HTTP Client**: Axios 1.10.0
- **State Management**: TanStack React Query 5.81.2
- **Icons**: Lucide React 0.523.0

## Admin Dashboard (Create React App + TypeScript)

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Installation

Navigate to the admin dashboard directory and install dependencies:

```bash
cd apps/admin-dashboard
npm install
```

### Environment Variables

Create a `.env` file in the `apps/admin-dashboard` directory:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8001
REACT_APP_USER_SERVICE_URL=http://localhost:8001
REACT_APP_PRODUCT_SERVICE_URL=http://localhost:8002
REACT_APP_ORDER_SERVICE_URL=http://localhost:8003
REACT_APP_PAYMENT_SERVICE_URL=http://localhost:8004
REACT_APP_ANALYTICS_SERVICE_URL=http://localhost:8006

# Authentication
REACT_APP_AUTH_SECRET=your-admin-secret-here

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_REPORTS=true
REACT_APP_DEBUG_MODE=false

# Proxy for development (already configured in package.json)
PROXY=http://localhost:3001
```

### Development Server

Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:3001`.

### Configuration Details

#### Proxy Configuration

The admin dashboard uses Create React App's built-in proxy feature for API calls during development. This is configured in `package.json`:

```json
{
  "proxy": "http://localhost:3001"
}
```

For more complex proxy needs, you can create a `setupProxy.js` file:

```javascript
// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/users',
    createProxyMiddleware({
      target: 'http://localhost:8001',
      changeOrigin: true,
    })
  );
  
  app.use(
    '/api/products',
    createProxyMiddleware({
      target: 'http://localhost:8002',
      changeOrigin: true,
    })
  );
  
  app.use(
    '/api/orders',
    createProxyMiddleware({
      target: 'http://localhost:8003',
      changeOrigin: true,
    })
  );
  
  app.use(
    '/api/payments',
    createProxyMiddleware({
      target: 'http://localhost:8004',
      changeOrigin: true,
    })
  );
  
  app.use(
    '/api/analytics',
    createProxyMiddleware({
      target: 'http://localhost:8006',
      changeOrigin: true,
    })
  );
};
```

#### Tailwind CSS Configuration

The admin dashboard uses Tailwind CSS 3.x with a professional admin theme:

- **Primary Colors**: Blue palette for primary actions
- **Secondary Colors**: Gray palette for secondary elements  
- **Forms Plugin**: Enhanced form styling with `@tailwindcss/forms`

### Scripts

Available npm scripts:

```bash
# Development server
npm start

# Production build
npm run build

# Run tests
npm test

# Eject from Create React App (not recommended)
npm run eject
```

### Dependencies

Key dependencies include:

- **Framework**: React 18.2.0
- **Routing**: React Router DOM 6.8.1
- **Styling**: Tailwind CSS 3.2.7
- **Forms**: React Hook Form 7.43.5
- **HTTP Client**: Axios 1.3.4
- **State Management**: React Query 3.39.3
- **Charts**: Chart.js 4.2.1 with React wrapper
- **Date Handling**: date-fns 2.29.3

## Connecting to Backend Services

### Service URLs

Both frontend applications connect to these backend services:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| User Service | 8001 | http://localhost:8001 | Authentication, user management |
| Product Catalog | 8002 | http://localhost:8002 | Product listings, categories |
| Order Service | 8003 | http://localhost:8003 | Order management, cart |
| Payment Service | 8004 | http://localhost:8004 | Payment processing |
| Inventory Service | 8005 | http://localhost:8005 | Stock management |
| Analytics Service | 8006 | http://localhost:8006 | Analytics data (admin only) |

### API Client Configuration

#### Next.js API Client

Create an API client in `frontend/customer-web/src/lib/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Service-specific clients
export const userService = axios.create({
  baseURL: process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8001',
  timeout: 10000,
});

export const productService = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:8002',
  timeout: 10000,
});

export const orderService = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:8003',
  timeout: 10000,
});

export const paymentService = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:8004',
  timeout: 10000,
});
```

#### React Admin API Client

Create an API client in `apps/admin-dashboard/src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_auth_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Service-specific clients for admin
export const adminUserService = axios.create({
  baseURL: process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8001',
  timeout: 10000,
});

export const adminProductService = axios.create({
  baseURL: process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:8002',
  timeout: 10000,
});

export const adminOrderService = axios.create({
  baseURL: process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:8003',
  timeout: 10000,
});

export const adminPaymentService = axios.create({
  baseURL: process.env.REACT_APP_PAYMENT_SERVICE_URL || 'http://localhost:8004',
  timeout: 10000,
});

export const analyticsService = axios.create({
  baseURL: process.env.REACT_APP_ANALYTICS_SERVICE_URL || 'http://localhost:8006',
  timeout: 10000,
});
```

## Build Process

### Tailwind CSS Build

Both applications use Tailwind CSS with PostCSS for processing:

#### Customer Web Build Process

```bash
# Development build (with watch mode)
npm run dev

# Production build
npm run build

# Build CSS separately (if needed)
npx tailwindcss -i ./src/app/globals.css -o ./dist/output.css --watch
```

#### Admin Dashboard Build Process

```bash
# Development (CSS built automatically)
npm start

# Production build
npm run build

# Build CSS separately (if needed)
npx tailwindcss -i ./src/index.css -o ./build/static/css/main.css
```

### Linting

Both applications include ESLint configuration:

#### Customer Web Linting

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Lint specific files
npx eslint src/components/**/*.tsx
```

#### Admin Dashboard Linting  

```bash
# Linting is integrated into the build process
npm start  # Runs with linting

# Manual linting (if configured)
npx eslint src/
```

## Development Workflow

### Starting Both Applications

1. **Start Backend Services** (see Service Setup sections):
   ```bash
   # Start required backend services
   docker-compose up -d postgres redis
   # Start individual services or use docker-compose.dev.yml when available
   ```

2. **Start Customer Web**:
   ```bash
   cd frontend/customer-web
   npm install
   npm run dev
   ```

3. **Start Admin Dashboard**:
   ```bash
   cd apps/admin-dashboard  
   npm install
   npm start
   ```

### Port Management

| Application | Port | URL |
|-------------|------|-----|
| Customer Web | 3000 | http://localhost:3000 |
| Admin Dashboard | 3001 | http://localhost:3001 |

### Hot Reload Configuration

Both applications support hot reload during development:

- **Next.js**: Uses Turbopack for fast refresh
- **Create React App**: Built-in Fast Refresh

### Environment-Specific Configuration

#### Development
- API calls go to localhost backend services
- Hot reload enabled
- Source maps enabled
- Debugging tools available

#### Production  
- API calls go to production backend URLs
- Optimized bundles
- Source maps disabled (for security)
- Service worker enabled (if configured)

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check what's running on ports
   netstat -an | grep :3000
   netstat -an | grep :3001
   
   # Kill processes if needed
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   ```

2. **API Connection Issues**:
   - Verify backend services are running
   - Check environment variables
   - Confirm proxy configuration
   - Check browser network tab for CORS issues

3. **Build Issues**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear Next.js cache
   rm -rf .next
   
   # Clear CRA cache
   rm -rf build
   ```

4. **Tailwind CSS Not Working**:
   - Verify `globals.css` imports in Next.js
   - Check `index.css` imports in CRA
   - Ensure content paths are correct in `tailwind.config.js`
   - Restart development server

### Debugging

#### Next.js Debugging
```bash
# Debug mode
DEBUG=* npm run dev

# Node.js debugging
NODE_OPTIONS='--inspect' npm run dev
```

#### React App Debugging
```bash
# Debug mode
REACT_APP_DEBUG=true npm start

# Verbose logging
npm start --verbose
```

## Next Steps

After setting up the frontend applications:

1. **Configure Authentication**: Set up user authentication flow
2. **Implement State Management**: Configure global state (Redux, Zustand, etc.)
3. **Add Error Boundaries**: Implement error handling components
4. **Setup Testing**: Configure Jest and React Testing Library
5. **Performance Optimization**: Implement code splitting and lazy loading
6. **PWA Features**: Add service workers and offline capabilities (if needed)

This completes the frontend setup guide. Both applications should now be running and able to communicate with the backend services during local development.
