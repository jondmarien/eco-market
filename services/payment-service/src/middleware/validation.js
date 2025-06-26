const Joi = require('joi');
const { PaymentMethod } = require('../models/Payment');
const config = require('../config/config');

// Common validation schemas
const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');
const uuidSchema = Joi.string().uuid().message('Invalid UUID format');

// Address schema
const addressSchema = Joi.object({
  line1: Joi.string().max(255).required(),
  line2: Joi.string().max(255).optional(),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100).required(),
  postalCode: Joi.string().max(20).required(),
  country: Joi.string().length(2).uppercase().required(), // ISO country codes
});

// Customer schema
const customerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().max(255).required(),
  phone: Joi.string().max(20).optional(),
  billingAddress: addressSchema.optional(),
});

// Payment creation validation
const createPaymentSchema = Joi.object({
  orderId: uuidSchema.required(),
  userId: uuidSchema.required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string()
    .valid(...config.payment.supportedCurrencies)
    .required(),
  method: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .required(),
  customer: customerSchema.required(),
  metadata: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  returnUrl: Joi.string().uri().optional(),
  cancelUrl: Joi.string().uri().optional(),
});

// Payment confirmation validation
const confirmPaymentSchema = Joi.object({
  paymentMethodId: Joi.string().optional(),
  returnUrl: Joi.string().uri().optional(),
  metadata: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
});

// Refund creation validation
const createRefundSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  reason: Joi.string()
    .valid('duplicate', 'fraudulent', 'requested_by_customer', 'other')
    .default('requested_by_customer'),
  metadata: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
});

// Query parameters validation
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded')
    .optional(),
});

// Date range validation
const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
});

// Webhook validation schemas
const stripeWebhookSchema = Joi.object({
  id: Joi.string().required(),
  object: Joi.string().valid('event').required(),
  type: Joi.string().required(),
  data: Joi.object().required(),
  created: Joi.number().required(),
  livemode: Joi.boolean().required(),
});

const paypalWebhookSchema = Joi.object({
  id: Joi.string().required(),
  event_type: Joi.string().required(),
  resource: Joi.object().required(),
  create_time: Joi.string().isoDate().required(),
});

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate (body, query, params)
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return res.status(400).json({
        error: 'Validation Error',
        message: errorMessage,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        })),
      });
    }

    // Replace the property with the validated value
    req[property] = value;
    next();
  };
};

/**
 * Custom validation for payment amounts based on currency
 */
const validatePaymentAmount = (req, res, next) => {
  const { amount, currency } = req.body;

  if (!amount || !currency) {
    return next();
  }

  const currencyUpper = currency.toUpperCase();
  
  // Check minimum amount
  const minAmount = config.payment.minimumAmount[currencyUpper];
  if (minAmount && amount < minAmount) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Amount below minimum for ${currencyUpper}: ${minAmount}`,
    });
  }

  // Check maximum amount
  const maxAmount = config.payment.maximumAmount[currencyUpper];
  if (maxAmount && amount > maxAmount) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Amount exceeds maximum for ${currencyUpper}: ${maxAmount}`,
    });
  }

  next();
};

/**
 * Validate ObjectId parameters
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Missing required parameter: ${paramName}`,
      });
    }

    const { error } = objectIdSchema.validate(id);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

/**
 * Validate UUID parameters
 */
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Missing required parameter: ${paramName}`,
      });
    }

    const { error } = uuidSchema.validate(id);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

/**
 * Validate webhook signature headers
 */
const validateWebhookHeaders = (provider) => {
  return (req, res, next) => {
    const headers = req.headers;

    if (provider === 'stripe') {
      if (!headers['stripe-signature']) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Missing Stripe signature header',
        });
      }
    } else if (provider === 'paypal') {
      const requiredHeaders = [
        'paypal-auth-algo',
        'paypal-transmission-id',
        'paypal-cert-id',
        'paypal-transmission-sig',
        'paypal-transmission-time',
      ];

      const missingHeaders = requiredHeaders.filter(header => !headers[header]);
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `Missing PayPal headers: ${missingHeaders.join(', ')}`,
        });
      }
    }

    next();
  };
};

/**
 * Global error handler for validation errors
 */
const handleValidationError = (error, req, res, next) => {
  if (error.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details,
    });
  }

  next(error);
};

module.exports = {
  // Validation middleware
  validate,
  validatePaymentAmount,
  validateObjectId,
  validateUUID,
  validateWebhookHeaders,
  handleValidationError,

  // Validation schemas
  schemas: {
    createPayment: createPaymentSchema,
    confirmPayment: confirmPaymentSchema,
    createRefund: createRefundSchema,
    pagination: paginationSchema,
    dateRange: dateRangeSchema,
    stripeWebhook: stripeWebhookSchema,
    paypalWebhook: paypalWebhookSchema,
    address: addressSchema,
    customer: customerSchema,
  },

  // Common validators
  validateCreatePayment: [
    validate(createPaymentSchema),
    validatePaymentAmount,
  ],
  validateConfirmPayment: validate(confirmPaymentSchema),
  validateCreateRefund: validate(createRefundSchema),
  validatePagination: validate(paginationSchema, 'query'),
  validateDateRange: validate(dateRangeSchema, 'query'),
  validateStripeWebhook: validate(stripeWebhookSchema),
  validatePayPalWebhook: validate(paypalWebhookSchema),
};
