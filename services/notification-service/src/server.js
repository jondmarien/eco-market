const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const connectDB = require('./config/database');
const logger = require('./middleware/logger');
const notificationRoutes = require('./routes/notifications');
const config = require('./config/config');
const NotificationService = require('./services/notificationService');

// Create Express app
const app = express();

// Initialize notification service for scheduled jobs
const notificationService = new NotificationService();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ecomarket.example.com'] 
    : true,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes only
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  });
  
  next();
});

// Health check endpoint (before other routes)
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({
      status: 'healthy',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// API routes
app.use('/api/notifications', notificationRoutes);

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'EcoMarket Notification Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      notifications: '/api/notifications',
      docs: '/api/docs',
    },
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'EcoMarket Notification Service',
    version: '1.0.0',
    description: 'Microservice for handling email, SMS, and push notifications',
    baseUrl: req.protocol + '://' + req.get('host'),
    endpoints: [
      {
        method: 'POST',
        path: '/api/notifications/send',
        description: 'Send a notification through multiple channels',
        body: {
          type: 'string (required)',
          title: 'string (required)',
          message: 'string (required)',
          channels: 'array (required) - ["email", "sms", "push"]',
          userId: 'string (optional)',
          templateId: 'string (optional)',
          templateData: 'object (optional)',
          priority: 'string (optional) - low, normal, high, critical',
          scheduledAt: 'ISO date string (optional)',
          metadata: 'object (optional)',
        },
      },
      {
        method: 'POST',
        path: '/api/notifications/bulk',
        description: 'Send bulk notifications',
        body: {
          notifications: 'array of notification objects',
        },
      },
      {
        method: 'POST',
        path: '/api/notifications/email',
        description: 'Send email notification directly',
        body: {
          to: 'string (required) - email address',
          subject: 'string (required)',
          message: 'string (required)',
          templateId: 'string (optional)',
          templateData: 'object (optional)',
        },
      },
      {
        method: 'POST',
        path: '/api/notifications/sms',
        description: 'Send SMS notification directly',
        body: {
          to: 'string (required) - phone number',
          message: 'string (required)',
          templateId: 'string (optional)',
          templateData: 'object (optional)',
        },
      },
      {
        method: 'GET',
        path: '/api/notifications/:id',
        description: 'Get notification by ID',
      },
      {
        method: 'GET',
        path: '/api/notifications/user/:userId',
        description: 'Get notification history for a user',
        query: {
          page: 'number (optional)',
          limit: 'number (optional)',
          type: 'string (optional)',
          status: 'string (optional)',
          startDate: 'ISO date string (optional)',
          endDate: 'ISO date string (optional)',
        },
      },
      {
        method: 'GET',
        path: '/api/notifications/stats',
        description: 'Get notification statistics',
        query: {
          startDate: 'ISO date string (optional)',
          endDate: 'ISO date string (optional)',
          userId: 'string (optional)',
          type: 'string (optional)',
        },
      },
      {
        method: 'GET',
        path: '/api/notifications/user/:userId/preferences',
        description: 'Get user notification preferences',
      },
      {
        method: 'PUT',
        path: '/api/notifications/user/:userId/preferences',
        description: 'Update user notification preferences',
        body: {
          email: 'string (optional)',
          phone: 'string (optional)',
          globalOptOut: 'boolean (optional)',
          channels: 'object (optional)',
          notificationTypes: 'object (optional)',
        },
      },
      {
        method: 'POST',
        path: '/api/notifications/webhooks/email',
        description: 'Handle email webhook events from SendGrid',
      },
      {
        method: 'POST',
        path: '/api/notifications/webhooks/sms',
        description: 'Handle SMS webhook events from Twilio',
      },
      {
        method: 'POST',
        path: '/api/notifications/process-scheduled',
        description: 'Manually trigger processing of scheduled notifications',
      },
      {
        method: 'GET',
        path: '/api/notifications/health',
        description: 'Health check for notification service',
      },
    ],
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    if (global.mongoose && global.mongoose.connection) {
      global.mongoose.connection.close(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Set up scheduled notification processing
const setupScheduledJobs = () => {
  // Process scheduled notifications every minute
  setInterval(async () => {
    try {
      const processed = await notificationService.processScheduledNotifications();
      if (processed > 0) {
        logger.info(`Processed ${processed} scheduled notifications`);
      }
    } catch (error) {
      logger.error('Error processing scheduled notifications', {
        error: error.message,
      });
    }
  }, 60000); // Run every minute

  logger.info('Scheduled notification processing initialized');
};

// Start server
const PORT = config.port || 3003;
const server = app.listen(PORT, () => {
  logger.info(`Notification Service running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
  
  // Set up scheduled jobs after server starts
  setupScheduledJobs();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason.toString(),
    promise: promise.toString(),
  });
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
