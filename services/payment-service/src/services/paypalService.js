const paypal = require('@paypal/checkout-server-sdk');
const config = require('../config/config');
const { Payment, PaymentStatus } = require('../models/Payment');
const logger = require('../middleware/logger');

class PayPalService {
  constructor() {
    // Set up PayPal environment
    const environment = config.paypal.environment === 'live' 
      ? new paypal.core.LiveEnvironment(config.paypal.clientId, config.paypal.clientSecret)
      : new paypal.core.SandboxEnvironment(config.paypal.clientId, config.paypal.clientSecret);
    
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  /**
   * Create a PayPal order
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} PayPal order details
   */
  async createOrder(paymentData) {
    try {
      const {
        amount,
        currency,
        orderId,
        userId,
        customer,
        metadata = {},
      } = paymentData;

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        application_context: {
          brand_name: 'EcoMarket',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: metadata.returnUrl || `${config.services.orderService}/payment/success`,
          cancel_url: metadata.cancelUrl || `${config.services.orderService}/payment/cancel`,
        },
        purchase_units: [{
          reference_id: orderId,
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2),
          },
          description: `Payment for order ${orderId}`,
          custom_id: userId,
          invoice_id: `INV-${orderId}-${Date.now()}`,
        }],
      });

      const order = await this.client.execute(request);

      logger.info('PayPal order created', {
        paypalOrderId: order.result.id,
        orderId,
        amount,
        currency,
      });

      // Extract approval URL
      const approvalUrl = order.result.links.find(link => link.rel === 'approve')?.href;

      return {
        id: order.result.id,
        status: this.mapPayPalStatus(order.result.status),
        amount: amount,
        currency: currency.toUpperCase(),
        approvalUrl,
        captureUrl: order.result.links.find(link => link.rel === 'capture')?.href,
      };
    } catch (error) {
      logger.error('Error creating PayPal order', {
        error: error.message,
        orderId: paymentData.orderId,
      });
      throw new Error(`PayPal order creation failed: ${error.message}`);
    }
  }

  /**
   * Capture a PayPal order
   * @param {string} paypalOrderId - PayPal order ID
   * @returns {Promise<Object>} Capture details
   */
  async captureOrder(paypalOrderId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
      request.requestBody({});

      const capture = await this.client.execute(request);

      logger.info('PayPal order captured', {
        paypalOrderId,
        captureId: capture.result.purchase_units[0]?.payments?.captures[0]?.id,
        status: capture.result.status,
      });

      return {
        id: capture.result.id,
        status: this.mapPayPalStatus(capture.result.status),
        captureId: capture.result.purchase_units[0]?.payments?.captures[0]?.id,
        amount: parseFloat(capture.result.purchase_units[0]?.payments?.captures[0]?.amount?.value || 0),
        currency: capture.result.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
      };
    } catch (error) {
      logger.error('Error capturing PayPal order', {
        error: error.message,
        paypalOrderId,
      });
      throw new Error(`PayPal order capture failed: ${error.message}`);
    }
  }

  /**
   * Get PayPal order details
   * @param {string} paypalOrderId - PayPal order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrder(paypalOrderId) {
    try {
      const request = new paypal.orders.OrdersGetRequest(paypalOrderId);
      const order = await this.client.execute(request);

      return {
        id: order.result.id,
        status: this.mapPayPalStatus(order.result.status),
        amount: parseFloat(order.result.purchase_units[0]?.amount?.value || 0),
        currency: order.result.purchase_units[0]?.amount?.currency_code,
        referenceId: order.result.purchase_units[0]?.reference_id,
        customId: order.result.purchase_units[0]?.custom_id,
      };
    } catch (error) {
      logger.error('Error retrieving PayPal order', {
        error: error.message,
        paypalOrderId,
      });
      throw new Error(`Failed to retrieve PayPal order: ${error.message}`);
    }
  }

  /**
   * Create a refund for a captured payment
   * @param {Object} refundData - Refund information
   * @returns {Promise<Object>} Refund details
   */
  async createRefund(refundData) {
    try {
      const {
        captureId,
        amount,
        currency,
        reason = 'Customer requested refund',
        metadata = {},
      } = refundData;

      const request = new paypal.payments.CapturesRefundRequest(captureId);
      request.requestBody({
        amount: amount ? {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2),
        } : undefined, // Full refund if amount not specified
        note_to_payer: reason,
        invoice_id: metadata.invoiceId,
      });

      const refund = await this.client.execute(request);

      logger.info('PayPal refund created', {
        refundId: refund.result.id,
        captureId,
        amount: refund.result.amount?.value,
        status: refund.result.status,
      });

      return {
        id: refund.result.id,
        amount: parseFloat(refund.result.amount?.value || 0),
        currency: refund.result.amount?.currency_code,
        status: refund.result.status,
        reason,
      };
    } catch (error) {
      logger.error('Error creating PayPal refund', {
        error: error.message,
        captureId: refundData.captureId,
      });
      throw new Error(`PayPal refund creation failed: ${error.message}`);
    }
  }

  /**
   * Handle PayPal webhook events
   * @param {Object} event - PayPal webhook event
   * @returns {Promise<boolean>} Success status
   */
  async handleWebhookEvent(event) {
    try {
      logger.info('Processing PayPal webhook event', {
        eventId: event.id,
        eventType: event.event_type,
      });

      switch (event.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
          await this.handleOrderApproved(event.resource);
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handleCaptureCompleted(event.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handleCaptureDenied(event.resource);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handleCaptureRefunded(event.resource);
          break;
        case 'CHECKOUT.ORDER.CANCELLED':
          await this.handleOrderCancelled(event.resource);
          break;
        default:
          logger.info('Unhandled PayPal webhook event type', {
            eventType: event.event_type,
          });
      }

      return true;
    } catch (error) {
      logger.error('Error handling PayPal webhook event', {
        error: error.message,
        eventId: event.id,
        eventType: event.event_type,
      });
      return false;
    }
  }

  /**
   * Handle order approved event
   * @param {Object} resource - PayPal resource object
   */
  async handleOrderApproved(resource) {
    const payment = await Payment.findOne({
      'paymentIntent.providerIntentId': resource.id,
    });

    if (payment) {
      await payment.updateStatus(PaymentStatus.PROCESSING, {
        paypalApprovalTime: new Date().toISOString(),
      });

      logger.info('PayPal order approved', {
        paymentId: payment._id,
        orderId: payment.orderId,
        paypalOrderId: resource.id,
      });
    }
  }

  /**
   * Handle capture completed event
   * @param {Object} resource - PayPal resource object
   */
  async handleCaptureCompleted(resource) {
    // Find payment by PayPal order ID (stored in metadata or reference)
    const payment = await Payment.findOne({
      $or: [
        { 'paymentIntent.providerIntentId': resource.supplementary_data?.related_ids?.order_id },
        { 'metadata.paypalCaptureId': resource.id },
      ],
    });

    if (payment) {
      await payment.updateStatus(PaymentStatus.COMPLETED, {
        paypalCaptureId: resource.id,
        paypalCaptureTime: resource.create_time,
      });

      logger.info('PayPal capture completed', {
        paymentId: payment._id,
        orderId: payment.orderId,
        captureId: resource.id,
      });
    }
  }

  /**
   * Handle capture denied event
   * @param {Object} resource - PayPal resource object
   */
  async handleCaptureDenied(resource) {
    const payment = await Payment.findOne({
      $or: [
        { 'paymentIntent.providerIntentId': resource.supplementary_data?.related_ids?.order_id },
        { 'metadata.paypalCaptureId': resource.id },
      ],
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = resource.status_details?.reason || 'Capture denied by PayPal';
      payment.failureCode = resource.status_details?.reason_code;
      await payment.save();

      logger.info('PayPal capture denied', {
        paymentId: payment._id,
        orderId: payment.orderId,
        captureId: resource.id,
        reason: payment.failureReason,
      });
    }
  }

  /**
   * Handle capture refunded event
   * @param {Object} resource - PayPal resource object
   */
  async handleCaptureRefunded(resource) {
    const payment = await Payment.findOne({
      'metadata.paypalCaptureId': resource.id,
    });

    if (payment) {
      const refundAmount = parseFloat(resource.amount?.value || 0);
      
      await payment.addRefund({
        id: resource.id,
        amount: refundAmount,
        currency: resource.amount?.currency_code || payment.currency,
        status: 'succeeded',
        reason: 'requested_by_customer',
        providerRefundId: resource.id,
        processedAt: new Date(resource.create_time),
      });

      logger.info('PayPal refund processed', {
        paymentId: payment._id,
        orderId: payment.orderId,
        refundAmount,
      });
    }
  }

  /**
   * Handle order cancelled event
   * @param {Object} resource - PayPal resource object
   */
  async handleOrderCancelled(resource) {
    const payment = await Payment.findOne({
      'paymentIntent.providerIntentId': resource.id,
    });

    if (payment) {
      await payment.updateStatus(PaymentStatus.CANCELLED);

      logger.info('PayPal order cancelled', {
        paymentId: payment._id,
        orderId: payment.orderId,
        paypalOrderId: resource.id,
      });
    }
  }

  /**
   * Map PayPal status to internal status
   * @param {string} paypalStatus - PayPal order/payment status
   * @returns {string} Internal payment status
   */
  mapPayPalStatus(paypalStatus) {
    const statusMap = {
      CREATED: PaymentStatus.PENDING,
      SAVED: PaymentStatus.PENDING,
      APPROVED: PaymentStatus.PROCESSING,
      VOIDED: PaymentStatus.CANCELLED,
      COMPLETED: PaymentStatus.COMPLETED,
      PAYER_ACTION_REQUIRED: PaymentStatus.PENDING,
    };

    return statusMap[paypalStatus] || PaymentStatus.PENDING;
  }

  /**
   * Validate PayPal webhook signature
   * @param {Object} headers - Request headers
   * @param {string} body - Raw request body
   * @returns {boolean} Validation result
   */
  validateWebhookSignature(headers, body) {
    // PayPal webhook signature validation would go here
    // This is a simplified version - in production you'd want to verify
    // the webhook signature using PayPal's verification API
    
    const authAlgo = headers['paypal-auth-algo'];
    const transmission = headers['paypal-transmission-id'];
    const cert = headers['paypal-cert-id'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const transmissionTime = headers['paypal-transmission-time'];

    // For now, just check that required headers are present
    if (!authAlgo || !transmission || !cert || !transmissionSig || !transmissionTime) {
      logger.warn('PayPal webhook missing required headers');
      return false;
    }

    // In production, you would:
    // 1. Get the certificate from PayPal
    // 2. Verify the signature using the certificate and payload
    // 3. Check the transmission time is recent
    
    return true;
  }
}

module.exports = PayPalService;
