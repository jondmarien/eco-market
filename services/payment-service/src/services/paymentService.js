const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const { Payment, PaymentStatus, PaymentMethod } = require('../models/Payment');
const StripeService = require('./stripeService');
const PayPalService = require('./paypalService');
const logger = require('../middleware/logger');

class PaymentService {
  constructor() {
    this.stripeService = new StripeService();
    this.paypalService = new PayPalService();
  }

  /**
   * Create a new payment
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Created payment with provider details
   */
  async createPayment(paymentData) {
    try {
      const {
        orderId,
        userId,
        amount,
        currency,
        method,
        customer,
        metadata = {},
      } = paymentData;

      // Validate payment data
      this.validatePaymentData(paymentData);

      // Create payment intent with the selected provider
      let paymentIntent;
      switch (method) {
        case PaymentMethod.STRIPE:
          paymentIntent = await this.stripeService.createPaymentIntent(paymentData);
          break;
        case PaymentMethod.PAYPAL:
          paymentIntent = await this.paypalService.createOrder(paymentData);
          break;
        default:
          throw new Error(`Unsupported payment method: ${method}`);
      }

      // Create payment record in database
      const payment = new Payment({
        orderId,
        userId,
        amount,
        currency: currency.toUpperCase(),
        method,
        status: PaymentStatus.PENDING,
        paymentIntent: {
          id: uuidv4(),
          provider: method,
          providerIntentId: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret,
          metadata: new Map(Object.entries(metadata)),
        },
        customer,
        metadata: new Map(Object.entries({
          ...metadata,
          providerData: JSON.stringify(paymentIntent),
        })),
      });

      await payment.save();

      logger.logPaymentEvent('PAYMENT_CREATED', {
        orderId,
        userId,
        amount,
        currency,
        method,
      });

      return {
        id: payment._id,
        paymentIntentId: payment.paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        approvalUrl: paymentIntent.approvalUrl, // For PayPal
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        createdAt: payment.createdAt,
      };
    } catch (error) {
      logger.logPaymentError(error, paymentData);
      throw error;
    }
  }

  /**
   * Confirm a payment
   * @param {string} paymentId - Payment ID
   * @param {Object} confirmationData - Confirmation details
   * @returns {Promise<Object>} Updated payment
   */
  async confirmPayment(paymentId, confirmationData = {}) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new Error(`Cannot confirm payment with status: ${payment.status}`);
      }

      let result;
      switch (payment.method) {
        case PaymentMethod.STRIPE:
          result = await this.stripeService.confirmPaymentIntent(
            payment.paymentIntent.providerIntentId,
            confirmationData
          );
          break;
        case PaymentMethod.PAYPAL:
          result = await this.paypalService.captureOrder(
            payment.paymentIntent.providerIntentId
          );
          break;
        default:
          throw new Error(`Unsupported payment method: ${payment.method}`);
      }

      // Update payment status
      await payment.updateStatus(this.mapProviderStatus(result.status, payment.method), {
        confirmationTime: new Date().toISOString(),
        providerTransactionId: result.captureId || result.id,
      });

      logger.logPaymentEvent('PAYMENT_CONFIRMED', {
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
      });

      return this.formatPaymentResponse(payment);
    } catch (error) {
      logger.logPaymentError(error, { paymentId });
      throw error;
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment details
   */
  async getPayment(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      return this.formatPaymentResponse(payment);
    } catch (error) {
      logger.error('Error retrieving payment', { error: error.message, paymentId });
      throw error;
    }
  }

  /**
   * Get payment by order ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentByOrderId(orderId) {
    try {
      const payment = await Payment.findByOrderId(orderId);
      if (!payment) {
        throw new Error('Payment not found for order');
      }

      return this.formatPaymentResponse(payment);
    } catch (error) {
      logger.error('Error retrieving payment by order ID', { error: error.message, orderId });
      throw error;
    }
  }

  /**
   * Get payments for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated payments
   */
  async getUserPayments(userId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const payments = await Payment.findByUserId(userId, { page, limit, status });
      const total = await Payment.countDocuments({ userId, ...(status && { status }) });

      return {
        payments: payments.map(payment => this.formatPaymentResponse(payment)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error retrieving user payments', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create a refund
   * @param {string} paymentId - Payment ID
   * @param {Object} refundData - Refund details
   * @returns {Promise<Object>} Refund result
   */
  async createRefund(paymentId, refundData) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!payment.canRefund) {
        throw new Error('Payment cannot be refunded');
      }

      const { amount, reason = 'requested_by_customer', metadata = {} } = refundData;

      // Validate refund amount
      const refundAmount = amount || payment.netAmount;
      if (refundAmount > payment.netAmount) {
        throw new Error('Refund amount exceeds available amount');
      }

      let refundResult;
      const refundId = uuidv4();

      switch (payment.method) {
        case PaymentMethod.STRIPE:
          refundResult = await this.stripeService.createRefund({
            paymentIntentId: payment.paymentIntent.providerIntentId,
            amount: refundAmount,
            reason,
            metadata: { refundId, ...metadata },
          });
          break;
        case PaymentMethod.PAYPAL:
          const captureId = payment.metadata.get('paypalCaptureId') || 
                           payment.metadata.get('providerTransactionId');
          if (!captureId) {
            throw new Error('PayPal capture ID not found');
          }
          refundResult = await this.paypalService.createRefund({
            captureId,
            amount: refundAmount,
            currency: payment.currency,
            reason,
            metadata: { refundId, ...metadata },
          });
          break;
        default:
          throw new Error(`Refunds not supported for payment method: ${payment.method}`);
      }

      // Add refund to payment
      await payment.addRefund({
        id: refundId,
        amount: refundAmount,
        currency: payment.currency,
        status: 'pending',
        reason,
        providerRefundId: refundResult.id,
        metadata: new Map(Object.entries(metadata)),
      });

      logger.logPaymentEvent('REFUND_CREATED', {
        orderId: payment.orderId,
        userId: payment.userId,
        amount: refundAmount,
        currency: payment.currency,
        method: payment.method,
      });

      return {
        refundId,
        amount: refundAmount,
        currency: payment.currency,
        status: refundResult.status,
        providerRefundId: refundResult.id,
      };
    } catch (error) {
      logger.logPaymentError(error, { paymentId, ...refundData });
      throw error;
    }
  }

  /**
   * Cancel a payment
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Updated payment
   */
  async cancelPayment(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (![PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(payment.status)) {
        throw new Error(`Cannot cancel payment with status: ${payment.status}`);
      }

      // For Stripe, we can cancel payment intents
      // For PayPal, we can void orders if not yet captured
      if (payment.method === PaymentMethod.STRIPE) {
        // Stripe cancellation would be handled here if needed
      }

      await payment.updateStatus(PaymentStatus.CANCELLED, {
        cancellationTime: new Date().toISOString(),
      });

      logger.logPaymentEvent('PAYMENT_CANCELLED', {
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
      });

      return this.formatPaymentResponse(payment);
    } catch (error) {
      logger.logPaymentError(error, { paymentId });
      throw error;
    }
  }

  /**
   * Get payment statistics
   * @param {Object} filters - Date and other filters
   * @returns {Promise<Object>} Payment statistics
   */
  async getPaymentStats(filters = {}) {
    try {
      const stats = await Payment.getPaymentStats(filters);
      
      // Transform aggregation results
      const result = {
        total: 0,
        totalAmount: 0,
        byStatus: {},
        avgAmount: 0,
      };

      stats.forEach(stat => {
        result.total += stat.count;
        result.totalAmount += stat.totalAmount;
        result.byStatus[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
          avgAmount: stat.avgAmount,
        };
      });

      result.avgAmount = result.total > 0 ? result.totalAmount / result.total : 0;

      return result;
    } catch (error) {
      logger.error('Error retrieving payment stats', { error: error.message, filters });
      throw error;
    }
  }

  /**
   * Process webhook events
   * @param {string} provider - Payment provider (stripe/paypal)
   * @param {Object} event - Webhook event
   * @param {Object} headers - Request headers for signature validation
   * @param {string} rawBody - Raw request body
   * @returns {Promise<boolean>} Processing result
   */
  async processWebhook(provider, event, headers, rawBody) {
    try {
      logger.logWebhookEvent(provider, event);

      switch (provider.toLowerCase()) {
        case 'stripe':
          // Validate Stripe webhook signature
          const stripeEvent = this.stripeService.validateWebhookSignature(rawBody, headers['stripe-signature']);
          return await this.stripeService.handleWebhookEvent(stripeEvent);
        
        case 'paypal':
          // Validate PayPal webhook signature
          if (!this.paypalService.validateWebhookSignature(headers, rawBody)) {
            throw new Error('Invalid PayPal webhook signature');
          }
          return await this.paypalService.handleWebhookEvent(event);
        
        default:
          throw new Error(`Unsupported webhook provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Error processing webhook', {
        error: error.message,
        provider,
        eventId: event.id,
      });
      throw error;
    }
  }

  /**
   * Validate payment data
   * @param {Object} paymentData - Payment data to validate
   */
  validatePaymentData(paymentData) {
    const { amount, currency, method, orderId, userId } = paymentData;

    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!currency || !config.payment.supportedCurrencies.includes(currency.toUpperCase())) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    if (!method || !Object.values(PaymentMethod).includes(method)) {
      throw new Error(`Unsupported payment method: ${method}`);
    }

    if (!orderId || !userId) {
      throw new Error('Order ID and User ID are required');
    }

    // Check minimum amount
    const minAmount = config.payment.minimumAmount[currency.toUpperCase()];
    if (minAmount && amount < minAmount) {
      throw new Error(`Amount below minimum: ${minAmount} ${currency}`);
    }

    // Check maximum amount
    const maxAmount = config.payment.maximumAmount[currency.toUpperCase()];
    if (maxAmount && amount > maxAmount) {
      throw new Error(`Amount exceeds maximum: ${maxAmount} ${currency}`);
    }
  }

  /**
   * Map provider status to internal status
   * @param {string} providerStatus - Provider-specific status
   * @param {string} method - Payment method
   * @returns {string} Internal status
   */
  mapProviderStatus(providerStatus, method) {
    if (method === PaymentMethod.STRIPE) {
      return this.stripeService.mapStripeStatus(providerStatus);
    } else if (method === PaymentMethod.PAYPAL) {
      return this.paypalService.mapPayPalStatus(providerStatus);
    }
    return PaymentStatus.PENDING;
  }

  /**
   * Format payment response
   * @param {Object} payment - Payment document
   * @returns {Object} Formatted payment
   */
  formatPaymentResponse(payment) {
    return {
      id: payment._id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      netAmount: payment.netAmount,
      totalRefunded: payment.totalRefunded,
      canRefund: payment.canRefund,
      paymentIntent: {
        id: payment.paymentIntent.id,
        clientSecret: payment.paymentIntent.clientSecret,
      },
      customer: payment.customer,
      refunds: payment.refunds,
      fees: payment.fees,
      failureReason: payment.failureReason,
      failureCode: payment.failureCode,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      processedAt: payment.processedAt,
    };
  }
}

module.exports = PaymentService;
