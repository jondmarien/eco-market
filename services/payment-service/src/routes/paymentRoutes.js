const express = require('express');
const PaymentController = require('../controllers/paymentController');
const {
  validateCreatePayment,
  validateConfirmPayment,
  validateCreateRefund,
  validatePagination,
  validateDateRange,
  validateObjectId,
  validateUUID,
  validateWebhookHeaders,
} = require('../middleware/validation');

const router = express.Router();
const paymentController = new PaymentController();

// Payment routes
router.post('/', validateCreatePayment, paymentController.createPayment.bind(paymentController));
router.get('/config', paymentController.getPaymentConfig.bind(paymentController));
router.get('/stats', validateDateRange, paymentController.getPaymentStats.bind(paymentController));

router.get('/:paymentId', validateObjectId('paymentId'), paymentController.getPayment.bind(paymentController));
router.post('/:paymentId/confirm', validateObjectId('paymentId'), validateConfirmPayment, paymentController.confirmPayment.bind(paymentController));
router.post('/:paymentId/cancel', validateObjectId('paymentId'), paymentController.cancelPayment.bind(paymentController));
router.post('/:paymentId/refund', validateObjectId('paymentId'), validateCreateRefund, paymentController.createRefund.bind(paymentController));

// Order-based routes
router.get('/order/:orderId', validateUUID('orderId'), paymentController.getPaymentByOrderId.bind(paymentController));

// User-based routes
router.get('/user/:userId', validateUUID('userId'), validatePagination, paymentController.getUserPayments.bind(paymentController));

// Webhook routes
router.post('/webhooks/stripe', validateWebhookHeaders('stripe'), paymentController.handleStripeWebhook.bind(paymentController));
router.post('/webhooks/paypal', validateWebhookHeaders('paypal'), paymentController.handlePayPalWebhook.bind(paymentController));

module.exports = router;
