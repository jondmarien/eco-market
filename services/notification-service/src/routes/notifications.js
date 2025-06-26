const express = require('express');
const NotificationService = require('../services/notificationService');
const EmailService = require('../services/emailService');
const SMSService = require('../services/smsService');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const logger = require('../middleware/logger');
const { validationResult, body, param, query } = require('express-validator');

const router = express.Router();
const notificationService = new NotificationService();
const emailService = new EmailService();
const smsService = new SMSService();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * @route POST /api/notifications/send
 * @desc Send a notification
 * @access Public
 */
router.post('/send', [
  body('type').notEmpty().withMessage('Notification type is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('channels').isArray().withMessage('Channels must be an array'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'critical']),
], validateRequest, async (req, res) => {
  try {
    const result = await notificationService.sendNotification(req.body);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to send notification', {
      error: error.message,
      body: req.body,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      message: error.message,
    });
  }
});

/**
 * @route POST /api/notifications/bulk
 * @desc Send bulk notifications
 * @access Public
 */
router.post('/bulk', [
  body('notifications').isArray().withMessage('Notifications must be an array'),
  body('notifications.*.type').notEmpty().withMessage('Each notification must have a type'),
  body('notifications.*.title').notEmpty().withMessage('Each notification must have a title'),
  body('notifications.*.message').notEmpty().withMessage('Each notification must have a message'),
], validateRequest, async (req, res) => {
  try {
    const { notifications } = req.body;
    const results = await notificationService.sendBulkNotifications(notifications);
    
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };
    
    res.status(200).json({
      success: true,
      data: {
        summary,
        results,
      },
    });
  } catch (error) {
    logger.error('Failed to send bulk notifications', {
      error: error.message,
      notificationCount: req.body.notifications?.length,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk notifications',
      message: error.message,
    });
  }
});

/**
 * @route POST /api/notifications/email
 * @desc Send email notification directly
 * @access Public
 */
router.post('/email', [
  body('to').isEmail().withMessage('Valid email address is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
], validateRequest, async (req, res) => {
  try {
    const result = await emailService.sendEmail(req.body);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to send email', {
      error: error.message,
      to: req.body.to,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      message: error.message,
    });
  }
});

/**
 * @route POST /api/notifications/sms
 * @desc Send SMS notification directly
 * @access Public
 */
router.post('/sms', [
  body('to').notEmpty().withMessage('Phone number is required'),
  body('message').notEmpty().withMessage('Message is required'),
], validateRequest, async (req, res) => {
  try {
    const result = await smsService.sendSMS(req.body);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to send SMS', {
      error: error.message,
      to: req.body.to,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS',
      message: error.message,
    });
  }
});

/**
 * @route GET /api/notifications/:id
 * @desc Get notification by ID
 * @access Public
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Valid notification ID is required'),
], validateRequest, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Failed to get notification', {
      error: error.message,
      notificationId: req.params.id,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get notification',
      message: error.message,
    });
  }
});

/**
 * @route GET /api/notifications/user/:userId
 * @desc Get notification history for a user
 * @access Public
 */
router.get('/user/:userId', [
  param('userId').notEmpty().withMessage('User ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      type: req.query.type,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    
    const result = await notificationService.getNotificationHistory(userId, options);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to get notification history', {
      error: error.message,
      userId: req.params.userId,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get notification history',
      message: error.message,
    });
  }
});

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      type: req.query.type,
    };
    
    const stats = await notificationService.getNotificationStats(filters);
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get notification stats', {
      error: error.message,
      filters: req.query,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get notification stats',
      message: error.message,
    });
  }
});

/**
 * @route GET /api/notifications/user/:userId/preferences
 * @desc Get user notification preferences
 * @access Public
 */
router.get('/user/:userId/preferences', [
  param('userId').notEmpty().withMessage('User ID is required'),
], validateRequest, async (req, res) => {
  try {
    const preferences = await notificationService.getUserPreferences(req.params.userId);
    
    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error('Failed to get user preferences', {
      error: error.message,
      userId: req.params.userId,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user preferences',
      message: error.message,
    });
  }
});

/**
 * @route PUT /api/notifications/user/:userId/preferences
 * @desc Update user notification preferences
 * @access Public
 */
router.put('/user/:userId/preferences', [
  param('userId').notEmpty().withMessage('User ID is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().notEmpty().withMessage('Valid phone number is required'),
], validateRequest, async (req, res) => {
  try {
    const preferences = await notificationService.updateUserPreferences(
      req.params.userId,
      req.body
    );
    
    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error('Failed to update user preferences', {
      error: error.message,
      userId: req.params.userId,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update user preferences',
      message: error.message,
    });
  }
});

/**
 * @route POST /api/notifications/webhooks/email
 * @desc Handle email webhook events
 * @access Public
 */
router.post('/webhooks/email', async (req, res) => {
  try {
    logger.info('Received email webhook', { body: req.body });
    
    const result = await emailService.processWebhookEvent(req.body);
    
    res.status(200).json({
      success: result,
      message: 'Webhook processed',
    });
  } catch (error) {
    logger.error('Failed to process email webhook', {
      error: error.message,
      body: req.body,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
    });
  }
});

/**
 * @route POST /api/notifications/webhooks/sms
 * @desc Handle SMS webhook events
 * @access Public
 */
router.post('/webhooks/sms', async (req, res) => {
  try {
    logger.info('Received SMS webhook', { body: req.body });
    
    const result = await smsService.processWebhookEvent(req.body);
    
    res.status(200).json({
      success: result,
      message: 'Webhook processed',
    });
  } catch (error) {
    logger.error('Failed to process SMS webhook', {
      error: error.message,
      body: req.body,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
    });
  }
});

/**
 * @route POST /api/notifications/process-scheduled
 * @desc Manually trigger processing of scheduled notifications
 * @access Public
 */
router.post('/process-scheduled', async (req, res) => {
  try {
    const processed = await notificationService.processScheduledNotifications();
    
    res.status(200).json({
      success: true,
      data: {
        processed,
        message: `Processed ${processed} scheduled notifications`,
      },
    });
  } catch (error) {
    logger.error('Failed to process scheduled notifications', {
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process scheduled notifications',
      message: error.message,
    });
  }
});

/**
 * @route GET /api/notifications/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const notificationCount = await Notification.countDocuments();
    
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      notifications: {
        total: notificationCount,
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

module.exports = router;
