const PaymentService = require('../services/paymentService');
const logger = require('../middleware/logger');

class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Create a new payment
   */
  async createPayment(req, res) {
    try {
      const paymentData = req.body;
      
      logger.info('Creating payment', {
        orderId: paymentData.orderId,
        userId: paymentData.userId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: paymentData.method,
      });

      const payment = await this.paymentService.createPayment(paymentData);

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully',
      });
    } catch (error) {
      logger.error('Error creating payment', {
        error: error.message,
        paymentData: req.body,
      });

      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const confirmationData = req.body;

      logger.info('Confirming payment', {
        paymentId,
        confirmationData,
      });

      const payment = await this.paymentService.confirmPayment(paymentId, confirmationData);

      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment confirmed successfully',
      });
    } catch (error) {
      logger.error('Error confirming payment', {
        error: error.message,
        paymentId: req.params.paymentId,
      });

      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await this.paymentService.getPayment(paymentId);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error retrieving payment', {
        error: error.message,
        paymentId: req.params.paymentId,
      });

      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(req, res) {
    try {
      const { orderId } = req.params;

      const payment = await this.paymentService.getPaymentByOrderId(orderId);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error retrieving payment by order ID', {
        error: error.message,
        orderId: req.params.orderId,
      });

      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get payments for a user
   */
  async getUserPayments(req, res) {
    try {
      const { userId } = req.params;
      const options = req.query;

      const result = await this.paymentService.getUserPayments(userId, options);

      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error retrieving user payments', {
        error: error.message,
        userId: req.params.userId,
        options: req.query,
      });

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Create a refund
   */
  async createRefund(req, res) {
    try {
      const { paymentId } = req.params;
      const refundData = req.body;

      logger.info('Creating refund', {
        paymentId,
        refundData,
      });

      const refund = await this.paymentService.createRefund(paymentId, refundData);

      res.status(201).json({
        success: true,
        data: refund,
        message: 'Refund created successfully',
      });
    } catch (error) {
      logger.error('Error creating refund', {
        error: error.message,
        paymentId: req.params.paymentId,
        refundData: req.body,
      });

      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(req, res) {
    try {
      const { paymentId } = req.params;

      logger.info('Cancelling payment', { paymentId });

      const payment = await this.paymentService.cancelPayment(paymentId);

      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment cancelled successfully',
      });
    } catch (error) {
      logger.error('Error cancelling payment', {
        error: error.message,
        paymentId: req.params.paymentId,
      });

      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(req, res) {
    try {
      const filters = req.query;

      const stats = await this.paymentService.getPaymentStats(filters);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error retrieving payment stats', {
        error: error.message,
        filters: req.query,
      });

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleStripeWebhook(req, res) {
    try {
      const event = req.body;
      const signature = req.headers['stripe-signature'];

      logger.info('Received Stripe webhook', {
        eventId: event.id,
        eventType: event.type,
      });

      const success = await this.paymentService.processWebhook(
        'stripe',
        event,
        req.headers,
        req.rawBody
      );

      if (success) {
        res.status(200).json({ received: true });
      } else {
        res.status(400).json({ error: 'Webhook processing failed' });
      }
    } catch (error) {
      logger.error('Error processing Stripe webhook', {
        error: error.message,
        eventId: req.body?.id,
      });

      res.status(400).json({
        error: 'Webhook processing failed',
        message: error.message,
      });
    }
  }

  /**
   * Handle PayPal webhooks
   */
  async handlePayPalWebhook(req, res) {
    try {
      const event = req.body;

      logger.info('Received PayPal webhook', {
        eventId: event.id,
        eventType: event.event_type,
      });

      const success = await this.paymentService.processWebhook(
        'paypal',
        event,
        req.headers,
        req.rawBody
      );

      if (success) {
        res.status(200).json({ received: true });
      } else {
        res.status(400).json({ error: 'Webhook processing failed' });
      }
    } catch (error) {
      logger.error('Error processing PayPal webhook', {
        error: error.message,
        eventId: req.body?.id,
      });

      res.status(400).json({
        error: 'Webhook processing failed',
        message: error.message,
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      // You could add more comprehensive health checks here
      // such as database connectivity, external service availability, etc.
      
      res.status(200).json({
        success: true,
        message: 'Payment service is healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      
      res.status(503).json({
        success: false,
        message: 'Payment service is unhealthy',
        error: error.message,
      });
    }
  }

  /**
   * Get supported payment methods and configurations
   */
  async getPaymentConfig(req, res) {
    try {
      const config = require('../config/config');

      res.status(200).json({
        success: true,
        data: {
          supportedCurrencies: config.payment.supportedCurrencies,
          supportedMethods: Object.values(require('../models/Payment').PaymentMethod),
          minimumAmounts: config.payment.minimumAmount,
          maximumAmounts: config.payment.maximumAmount,
          defaultCurrency: config.payment.defaultCurrency,
        },
      });
    } catch (error) {
      logger.error('Error retrieving payment config', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = PaymentController;
