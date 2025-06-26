const stripe = require('stripe');
const config = require('../config/config');
const { Payment, PaymentStatus } = require('../models/Payment');
const logger = require('../middleware/logger');

class StripeService {
  constructor() {
    this.stripe = stripe(config.stripe.secretKey);
  }

  /**
   * Create a payment intent with Stripe
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment intent details
   */
  async createPaymentIntent(paymentData) {
    try {
      const {
        amount,
        currency,
        orderId,
        userId,
        customer,
        metadata = {},
      } = paymentData;

      // Convert amount to cents for Stripe (assuming amount is in dollars)
      const amountInCents = Math.round(amount * 100);

      // Create or retrieve customer
      let stripeCustomer;
      if (customer?.email) {
        stripeCustomer = await this.findOrCreateCustomer(customer);
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        customer: stripeCustomer?.id,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId,
          userId,
          ...metadata,
        },
        description: `Payment for order ${orderId}`,
      });

      logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        orderId,
        amount,
        currency,
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: amount,
        currency: currency.toUpperCase(),
        customerId: stripeCustomer?.id,
      };
    } catch (error) {
      logger.error('Error creating Stripe payment intent', {
        error: error.message,
        orderId: paymentData.orderId,
      });
      throw new Error(`Stripe payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {Object} paymentMethod - Payment method details
   * @returns {Promise<Object>} Confirmed payment intent
   */
  async confirmPaymentIntent(paymentIntentId, paymentMethod = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethod.id,
          return_url: paymentMethod.returnUrl,
        }
      );

      logger.info('Stripe payment intent confirmed', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return {
        id: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      logger.error('Error confirming Stripe payment intent', {
        error: error.message,
        paymentIntentId,
      });
      throw new Error(`Stripe payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Payment intent details
   */
  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      logger.error('Error retrieving Stripe payment intent', {
        error: error.message,
        paymentIntentId,
      });
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Create a refund
   * @param {Object} refundData - Refund information
   * @returns {Promise<Object>} Refund details
   */
  async createRefund(refundData) {
    try {
      const {
        paymentIntentId,
        amount,
        reason = 'requested_by_customer',
        metadata = {},
      } = refundData;

      // Convert amount to cents if provided
      const refundParams = {
        payment_intent: paymentIntentId,
        reason,
        metadata,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info('Stripe refund created', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount / 100,
      });

      return {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status,
        reason: refund.reason,
      };
    } catch (error) {
      logger.error('Error creating Stripe refund', {
        error: error.message,
        paymentIntentId: refundData.paymentIntentId,
      });
      throw new Error(`Stripe refund creation failed: ${error.message}`);
    }
  }

  /**
   * Find or create a Stripe customer
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Stripe customer
   */
  async findOrCreateCustomer(customerData) {
    try {
      const { email, name, phone } = customerData;

      // Search for existing customer
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
      });

      logger.info('Stripe customer created', {
        customerId: customer.id,
        email,
      });

      return customer;
    } catch (error) {
      logger.error('Error finding/creating Stripe customer', {
        error: error.message,
        email: customerData.email,
      });
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<boolean>} Success status
   */
  async handleWebhookEvent(event) {
    try {
      logger.info('Processing Stripe webhook event', {
        eventId: event.id,
        eventType: event.type,
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object);
          break;
        default:
          logger.info('Unhandled Stripe webhook event type', {
            eventType: event.type,
          });
      }

      return true;
    } catch (error) {
      logger.error('Error handling Stripe webhook event', {
        error: error.message,
        eventId: event.id,
        eventType: event.type,
      });
      return false;
    }
  }

  /**
   * Handle successful payment
   * @param {Object} paymentIntent - Stripe payment intent object
   */
  async handlePaymentSucceeded(paymentIntent) {
    const payment = await Payment.findOne({
      'paymentIntent.providerIntentId': paymentIntent.id,
    });

    if (payment) {
      await payment.updateStatus(PaymentStatus.COMPLETED, {
        stripeChargeId: paymentIntent.latest_charge,
        stripeReceiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
      });

      logger.info('Payment marked as completed', {
        paymentId: payment._id,
        orderId: payment.orderId,
      });
    }
  }

  /**
   * Handle failed payment
   * @param {Object} paymentIntent - Stripe payment intent object
   */
  async handlePaymentFailed(paymentIntent) {
    const payment = await Payment.findOne({
      'paymentIntent.providerIntentId': paymentIntent.id,
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = paymentIntent.last_payment_error?.message;
      payment.failureCode = paymentIntent.last_payment_error?.code;
      await payment.save();

      logger.info('Payment marked as failed', {
        paymentId: payment._id,
        orderId: payment.orderId,
        reason: payment.failureReason,
      });
    }
  }

  /**
   * Handle canceled payment
   * @param {Object} paymentIntent - Stripe payment intent object
   */
  async handlePaymentCanceled(paymentIntent) {
    const payment = await Payment.findOne({
      'paymentIntent.providerIntentId': paymentIntent.id,
    });

    if (payment) {
      await payment.updateStatus(PaymentStatus.CANCELLED);

      logger.info('Payment marked as cancelled', {
        paymentId: payment._id,
        orderId: payment.orderId,
      });
    }
  }

  /**
   * Handle charge dispute
   * @param {Object} dispute - Stripe dispute object
   */
  async handleChargeDispute(dispute) {
    logger.warn('Charge dispute created', {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount / 100,
      reason: dispute.reason,
    });

    // Here you would typically:
    // 1. Find the payment associated with the charge
    // 2. Update the payment status
    // 3. Notify relevant stakeholders
    // 4. Log the dispute for manual review
  }

  /**
   * Map Stripe payment status to internal status
   * @param {string} stripeStatus - Stripe payment status
   * @returns {string} Internal payment status
   */
  mapStripeStatus(stripeStatus) {
    const statusMap = {
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_action: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      requires_capture: PaymentStatus.PROCESSING,
      succeeded: PaymentStatus.COMPLETED,
      canceled: PaymentStatus.CANCELLED,
    };

    return statusMap[stripeStatus] || PaymentStatus.PENDING;
  }

  /**
   * Validate webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Verified event object
   */
  validateWebhookSignature(payload, signature) {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      logger.error('Stripe webhook signature validation failed', {
        error: error.message,
      });
      throw new Error('Invalid webhook signature');
    }
  }
}

module.exports = StripeService;
