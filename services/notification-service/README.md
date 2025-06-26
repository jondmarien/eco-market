# EcoMarket Notification Service

A comprehensive microservice for handling multi-channel notifications including email, SMS, and push notifications for the EcoMarket e-commerce platform.

## Features

### 🚀 Core Capabilities
- **Multi-channel notifications**: Email, SMS, Push (planned)
- **Template system**: Predefined templates with variable substitution
- **User preferences**: Granular notification controls per user
- **Bulk notifications**: Efficient batch processing
- **Scheduled notifications**: Time-based notification delivery
- **Webhook handling**: Real-time delivery status updates
- **Analytics**: Comprehensive notification statistics and history

### 📧 Email Features
- **SendGrid integration** with API key and SMTP support
- **MJML templates** for responsive email design
- **Template compilation** with Handlebars
- **Delivery tracking** via webhooks
- **Bulk email** with rate limiting
- **HTML and text** content support

### 📱 SMS Features
- **Twilio integration** for reliable SMS delivery
- **Phone number validation** (E.164 format)
- **Message length optimization** with automatic truncation
- **MMS support** for media attachments
- **Delivery status tracking** via webhooks
- **International number support**

### ⚙️ Technical Features
- **MongoDB storage** for notifications and preferences
- **Express.js REST API** with comprehensive endpoints
- **Request validation** using express-validator
- **Rate limiting** to prevent abuse
- **Comprehensive logging** with Winston
- **Health checks** and monitoring endpoints
- **Graceful shutdown** handling
- **Docker support** for containerization

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB database
- SendGrid API key (for email)
- Twilio credentials (for SMS)

### Installation

1. **Clone and install dependencies**:
```bash
cd services/notification-service
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the service**:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The service will start on port 3003 by default.

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3003

# Database
MONGODB_URI=mongodb://localhost:27017/ecomarket-notifications

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=notifications@ecomarket.com
SENDGRID_FROM_NAME=EcoMarket

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_PHONE=+1234567890

# Security
JWT_SECRET=your_jwt_secret

# Logging
LOG_LEVEL=info
```

## API Documentation

### Base URL
```
http://localhost:3003/api/notifications
```

### Core Endpoints

#### Send Notification
```http
POST /api/notifications/send
Content-Type: application/json

{
  "type": "order-confirmation",
  "title": "Order Confirmed",
  "message": "Your order has been confirmed!",
  "channels": ["email", "sms"],
  "userId": "user123",
  "templateId": "order-confirmation",
  "templateData": {
    "customerName": "John Doe",
    "orderNumber": "ORD001",
    "orderTotal": "99.99"
  },
  "priority": "normal",
  "metadata": {
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

#### Send Email Directly
```http
POST /api/notifications/email

{
  "to": "user@example.com",
  "subject": "Welcome to EcoMarket",
  "message": "Welcome to our sustainable marketplace!",
  "templateId": "welcome"
}
```

#### Send SMS Directly
```http
POST /api/notifications/sms

{
  "to": "+1234567890",
  "message": "Your EcoMarket order has shipped!",
  "templateId": "shipping-update"
}
```

#### Get Notification History
```http
GET /api/notifications/user/{userId}?page=1&limit=20&type=order-confirmation
```

#### Update User Preferences
```http
PUT /api/notifications/user/{userId}/preferences

{
  "email": "user@example.com",
  "phone": "+1234567890",
  "globalOptOut": false,
  "channels": {
    "email": { "enabled": true },
    "sms": { "enabled": true }
  },
  "notificationTypes": {
    "order-confirmation": { "email": true, "sms": true },
    "marketing": { "email": false, "sms": false }
  }
}
```

### Full API Reference

Visit `/api/docs` when the service is running for complete API documentation.

## Templates

### Email Templates

The service includes predefined email templates:
- `welcome` - New user welcome email
- `order-confirmation` - Order confirmation with details
- `payment-confirmation` - Payment received notification
- `shipping-update` - Shipping and tracking information
- `delivery-confirmation` - Delivery notification
- `password-reset` - Password reset instructions

### SMS Templates

Predefined SMS templates include:
- `order-confirmation` - Brief order confirmation
- `payment-confirmation` - Payment received
- `shipping-update` - Shipping notification
- `delivery-confirmation` - Delivery notification
- `password-reset` - Password reset code
- `account-verification` - Account verification code

### Template Variables

Templates support variable substitution using Handlebars syntax:
```
Hello {{customerName}}, your order #{{orderNumber}} is confirmed!
```

## Testing

### Run Tests
```bash
# Install test dependencies
npm install

# Start the service in another terminal
npm run dev

# Run tests
npm test
```

### Manual Testing
```bash
# Run comprehensive test suite
node test/test-notifications.js
```

## Webhooks

### Email Webhooks (SendGrid)
Configure SendGrid to send webhooks to:
```
POST /api/notifications/webhooks/email
```

### SMS Webhooks (Twilio)
Configure Twilio to send webhooks to:
```
POST /api/notifications/webhooks/sms
```

## Monitoring

### Health Checks
- Service health: `GET /health`
- Detailed health: `GET /api/notifications/health`

### Analytics
- Notification stats: `GET /api/notifications/stats`
- User history: `GET /api/notifications/user/{userId}`

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t ecomarket-notifications .

# Run container
docker run -p 3003:3003 --env-file .env ecomarket-notifications
```

### Production Considerations
- Set `NODE_ENV=production`
- Use environment variables for secrets
- Configure proper MongoDB connection string
- Set up monitoring and alerting
- Configure log aggregation
- Use a process manager like PM2

## Architecture

### Service Structure
```
src/
├── config/          # Configuration files
├── models/          # MongoDB models
├── services/        # Business logic services
├── routes/          # Express.js routes
├── middleware/      # Custom middleware
├── templates/       # Email templates
└── server.js        # Main server file
```

### Database Schema

#### Notifications Collection
```javascript
{
  userId: String,
  type: String,
  title: String,
  message: String,
  channels: [String],
  templateId: String,
  templateData: Object,
  priority: String,
  status: String,
  scheduledAt: Date,
  sentAt: Date,
  deliveryResults: [Object],
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### User Preferences Collection
```javascript
{
  userId: String,
  email: String,
  phone: String,
  globalOptOut: Boolean,
  channels: Object,
  notificationTypes: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## Integration

### With Other Services

The notification service integrates with other EcoMarket services:

```javascript
// Example: Sending order confirmation from Order Service
const response = await axios.post('http://notification-service:3003/api/notifications/send', {
  type: 'order-confirmation',
  title: 'Order Confirmed',
  message: 'Your EcoMarket order has been confirmed!',
  channels: ['email', 'sms'],
  userId: order.userId,
  templateId: 'order-confirmation',
  templateData: {
    customerName: order.customer.name,
    orderNumber: order.orderNumber,
    orderTotal: order.total,
    orderUrl: `https://ecomarket.com/orders/${order.id}`
  },
  metadata: {
    orderId: order.id,
    email: order.customer.email,
    phone: order.customer.phone
  }
});
```

## Performance

### Optimization Features
- **Batch processing** for bulk notifications
- **Rate limiting** to prevent API abuse
- **Connection pooling** for database operations
- **Caching** for templates and user preferences
- **Asynchronous processing** for webhook handling

### Scalability
- **Horizontal scaling** with multiple instances
- **Database indexing** for efficient queries
- **Queue support** for high-volume processing
- **Microservice architecture** for independent scaling

## Security

### Security Features
- **Input validation** on all endpoints
- **Rate limiting** to prevent abuse
- **CORS configuration** for cross-origin requests
- **Helmet.js** for security headers
- **Environment-based secrets** management

### Best Practices
- Never store API keys in code
- Use HTTPS in production
- Validate all user inputs
- Implement proper error handling
- Log security events

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## License

This project is part of the EcoMarket platform and is proprietary software.

## Support

For technical support or questions:
- Create an issue in the project repository
- Contact the development team
- Check the API documentation at `/api/docs`
