const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 8005,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/notification_service',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // Redis configuration for queue management
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },
  
  // Email service configuration (SendGrid)
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@ecomarket.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'EcoMarket',
    replyToEmail: process.env.SENDGRID_REPLY_TO || 'support@ecomarket.com',
  },
  
  // Alternative email service (AWS SES)
  ses: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_SES_REGION || 'us-east-1',
    fromEmail: process.env.SES_FROM_EMAIL || 'noreply@ecomarket.com',
  },
  
  // SMS service configuration (Twilio)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    fromPhone: process.env.TWILIO_FROM_PHONE,
  },
  
  // Push notification configuration
  webPush: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    email: process.env.VAPID_EMAIL || 'admin@ecomarket.com',
  },
  
  // Firebase Cloud Messaging (alternative push service)
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY,
    senderId: process.env.FCM_SENDER_ID,
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000, // Higher limit for notifications
  },
  
  // External services
  services: {
    userService: process.env.USER_SERVICE_URL || 'http://localhost:8001',
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:8003',
    paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8004',
    productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8002',
  },
  
  // Queue configuration
  queue: {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
    emailQueue: {
      name: 'email-notifications',
      concurrency: 5,
    },
    smsQueue: {
      name: 'sms-notifications',
      concurrency: 3,
    },
    pushQueue: {
      name: 'push-notifications',
      concurrency: 10,
    },
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filename: process.env.LOG_FILENAME || 'notification-service.log',
  },
  
  // Notification settings
  notifications: {
    maxRetries: parseInt(process.env.MAX_NOTIFICATION_RETRIES, 10) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY_MS, 10) || 5000,
    batchSize: parseInt(process.env.BATCH_SIZE, 10) || 100,
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
    enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS !== 'false',
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false',
    
    // Template settings
    templateCacheEnabled: process.env.TEMPLATE_CACHE_ENABLED !== 'false',
    templateCacheTTL: parseInt(process.env.TEMPLATE_CACHE_TTL, 10) || 3600, // 1 hour
    
    // Email settings
    emailSubjectPrefix: process.env.EMAIL_SUBJECT_PREFIX || '[EcoMarket] ',
    emailBatchSize: parseInt(process.env.EMAIL_BATCH_SIZE, 10) || 50,
    
    // SMS settings
    smsBatchSize: parseInt(process.env.SMS_BATCH_SIZE, 10) || 20,
    smsMaxLength: parseInt(process.env.SMS_MAX_LENGTH, 10) || 160,
    
    // Push settings
    pushBatchSize: parseInt(process.env.PUSH_BATCH_SIZE, 10) || 100,
    pushTTL: parseInt(process.env.PUSH_TTL, 10) || 24 * 60 * 60, // 24 hours
  },
  
  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || 'notification-service-secret',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key',
    webhookSecret: process.env.WEBHOOK_SECRET || 'webhook-secret',
  },
  
  // Feature flags
  features: {
    enableTemplateEditor: process.env.ENABLE_TEMPLATE_EDITOR === 'true',
    enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
    enableWebhooks: process.env.ENABLE_WEBHOOKS !== 'false',
    enableScheduledNotifications: process.env.ENABLE_SCHEDULED_NOTIFICATIONS !== 'false',
  },
};

// Validation function
const validateConfig = () => {
  const errors = [];
  
  // Check required email configuration
  if (config.notifications.enableEmailNotifications) {
    if (!config.sendgrid.apiKey && !config.ses.accessKeyId) {
      errors.push('Email notifications enabled but no email service configured (SendGrid or SES)');
    }
  }
  
  // Check required SMS configuration
  if (config.notifications.enableSmsNotifications) {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      errors.push('SMS notifications enabled but Twilio not configured');
    }
  }
  
  // Check required push notification configuration
  if (config.notifications.enablePushNotifications) {
    if (!config.webPush.publicKey || !config.webPush.privateKey) {
      if (!config.fcm.serverKey) {
        errors.push('Push notifications enabled but neither VAPID nor FCM configured');
      }
    }
  }
  
  // Check Redis configuration for queue
  if (!config.redis.url && !config.redis.host) {
    errors.push('Redis configuration required for notification queue');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
};

// Only validate in production or when explicitly requested
if (config.nodeEnv === 'production' || process.env.VALIDATE_CONFIG === 'true') {
  try {
    validateConfig();
    console.log('✅ Notification service configuration validation passed');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
}

module.exports = config;
