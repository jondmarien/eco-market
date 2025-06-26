const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 8004,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/payment_service',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600, // 1 hour
  },
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // PayPal configuration
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox', // sandbox or live
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key',
    saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 12,
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
  },
  
  // External services
  services: {
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:8003',
    userService: process.env.USER_SERVICE_URL || 'http://localhost:8001',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005',
  },
  
  // Webhook configuration
  webhooks: {
    stripe: {
      endpoint: '/webhooks/stripe',
    },
    paypal: {
      endpoint: '/webhooks/paypal',
    },
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filename: process.env.LOG_FILENAME || 'payment-service.log',
  },
  
  // Payment configuration
  payment: {
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
    minimumAmount: {
      USD: 0.50,
      EUR: 0.50,
      GBP: 0.30,
      CAD: 0.50,
    },
    maximumAmount: {
      USD: 999999.99,
      EUR: 999999.99,
      GBP: 999999.99,
      CAD: 999999.99,
    },
    defaultCurrency: 'USD',
    refundWindow: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  },
};

// Validation function
const validateConfig = () => {
  const requiredFields = [
    'stripe.secretKey',
    'stripe.publishableKey',
    'stripe.webhookSecret',
    'paypal.clientId',
    'paypal.clientSecret',
  ];
  
  const missingFields = [];
  
  requiredFields.forEach((field) => {
    const keys = field.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
        break;
      }
    }
  });
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
  }
  
  // Validate currency configuration
  if (!config.payment.supportedCurrencies.includes(config.payment.defaultCurrency)) {
    throw new Error('Default currency must be in supported currencies list');
  }
  
  return true;
};

// Only validate in production or when explicitly requested
if (config.nodeEnv === 'production' || process.env.VALIDATE_CONFIG === 'true') {
  try {
    validateConfig();
    console.log('✅ Configuration validation passed');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
}

module.exports = config;
