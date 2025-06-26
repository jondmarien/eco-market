# EcoMarket Admin Dashboard

A comprehensive admin dashboard for managing the EcoMarket e-commerce platform, built with React, TypeScript, and Tailwind CSS.

## Features

- **Authentication System** - Secure admin login with JWT tokens
- **Dashboard Overview** - Key metrics and analytics at a glance
- **Product Management** - Complete CRUD operations for products
- **User Management** - Manage users, roles, and permissions
- **Order Management** - Track and update order statuses
- **Responsive Design** - Mobile-friendly interface
- **Modern UI** - Clean design with Tailwind CSS

## Technology Stack

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Hook Form** - Form validation and management
- **React Query** - Data fetching and caching
- **Axios** - HTTP client for API calls
- **Chart.js** - Data visualization

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Layout.tsx     # Main layout with sidebar and header
│   ├── Sidebar.tsx    # Navigation sidebar
│   └── Header.tsx     # Top header with user info
├── pages/             # Page components
│   ├── Login.tsx      # Authentication page
│   ├── Dashboard.tsx  # Main dashboard
│   ├── Products.tsx   # Product management
│   └── ...
├── contexts/          # React contexts
│   └── AuthContext.tsx # Authentication state management
├── services/          # API services
│   └── api.ts         # API endpoints and HTTP client
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types and interfaces
├── hooks/             # Custom React hooks
└── App.tsx            # Main application component
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your API endpoint:
   ```
   REACT_APP_API_URL=http://localhost:3001/api/v1
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

## API Integration

The dashboard integrates with the EcoMarket backend APIs:

### Endpoints
- `POST /auth/admin/login` - Admin authentication
- `GET /dashboard/stats` - Dashboard analytics
- `GET /products` - Product listing
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /users` - User listing
- `GET /orders` - Order listing
- `PATCH /orders/:id/status` - Update order status

### Authentication

The dashboard uses JWT tokens for authentication:
- Tokens are stored in localStorage
- Automatic token refresh
- Protected routes require authentication
- Admin role verification

## Features in Detail

### Dashboard
- Real-time statistics
- Recent activity feed
- Quick action buttons
- Revenue and order metrics

### Product Management
- Product listing with pagination
- Add/edit product forms
- Image upload support
- Stock management
- Category organization

### User Management
- User role management
- Account status controls
- Activity tracking
- Registration analytics

### Order Management
- Order status tracking
- Payment verification
- Shipping management
- Customer communication

## Styling

The dashboard uses Tailwind CSS with custom utility classes:

```css
.sidebar-link     /* Navigation links */
.card            /* Content cards */
.btn-primary     /* Primary buttons */
.btn-secondary   /* Secondary buttons */
.input-field     /* Form inputs */
```

## Security

- JWT token authentication
- Role-based access control
- API request interceptors
- CSRF protection
- Input validation

## Performance

- React Query for efficient data fetching
- Lazy loading for route components
- Optimized bundle splitting
- Image optimization
- Responsive design

## Development

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Husky pre-commit hooks

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Deployment

### Docker
```bash
docker build -t admin-dashboard .
docker run -p 3000:3000 admin-dashboard
```

### Environment Variables
- `REACT_APP_API_URL` - Backend API endpoint
- `REACT_APP_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the EcoMarket platform.
