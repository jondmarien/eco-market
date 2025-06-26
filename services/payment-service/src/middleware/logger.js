const winston = require('winston');
const expressWinston = require('express-winston');
const config = require('../config/config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'payment-service' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Express Winston logger for HTTP requests
const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: false,
  colorize: false,
  ignoreRoute: (req, res) => {
    // Don't log health check requests
    return req.url === '/health' || req.url === '/api/v1/health';
  },
  requestWhitelist: ['url', 'headers', 'method', 'httpVersion', 'originalUrl', 'query'],
  responseWhitelist: ['statusCode'],
  dynamicMeta: (req, res) => {
    return {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
    };
  }
});

// Express Winston error logger
const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{err.message}}',
  requestWhitelist: ['url', 'headers', 'method', 'httpVersion', 'originalUrl', 'query'],
  dynamicMeta: (req, res, err) => {
    return {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      stack: err.stack,
    };
  }
});

// Custom error logging function
const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

// Custom info logging function
const logInfo = (message, context = {}) => {
  logger.info({
    message,
    ...context
  });
};

// Custom warn logging function
const logWarn = (message, context = {}) => {
  logger.warn({
    message,
    ...context
  });
};

// Custom debug logging function
const logDebug = (message, context = {}) => {
  logger.debug({
    message,
    ...context
  });
};

// Security logging function for sensitive events
const logSecurity = (event, context = {}) => {
  logger.warn({
    message: `SECURITY_EVENT: ${event}`,
    securityEvent: true,
    ...context
  });
};

// Payment specific logging functions
const logPaymentEvent = (event, paymentData, context = {}) => {
  logger.info({
    message: `PAYMENT_EVENT: ${event}`,
    paymentEvent: true,
    orderId: paymentData.orderId,
    userId: paymentData.userId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    method: paymentData.method,
    ...context
  });
};

const logPaymentError = (error, paymentData, context = {}) => {
  logger.error({
    message: `PAYMENT_ERROR: ${error.message}`,
    paymentError: true,
    orderId: paymentData.orderId,
    userId: paymentData.userId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    method: paymentData.method,
    stack: error.stack,
    ...context
  });
};

// Webhook logging function
const logWebhookEvent = (provider, event, context = {}) => {
  logger.info({
    message: `WEBHOOK_EVENT: ${provider} - ${event.type || event.event_type}`,
    webhookEvent: true,
    provider,
    eventId: event.id,
    eventType: event.type || event.event_type,
    ...context
  });
};

// Rate limit logging
const logRateLimit = (ip, endpoint, context = {}) => {
  logger.warn({
    message: `RATE_LIMIT_EXCEEDED: ${ip} - ${endpoint}`,
    rateLimitEvent: true,
    ip,
    endpoint,
    ...context
  });
};

// Export logger and helper functions
module.exports = {
  logger,
  requestLogger,
  errorLogger,
  logError,
  logInfo,
  logWarn,
  logDebug,
  logSecurity,
  logPaymentEvent,
  logPaymentError,
  logWebhookEvent,
  logRateLimit,
  
  // For compatibility with existing code
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
};
