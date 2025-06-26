const EmailService = require('./emailService');
const SMSService = require('./smsService');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const config = require('../config/config');
const logger = require('../middleware/logger');

class NotificationService {
  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  /**
   * Send a notification through multiple channels
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendNotification(notificationData) {
    try {
      const {
        userId,
        type,
        title,
        message,
        channels = ['email'],
        templateId,
        templateData = {},
        priority = 'normal',
        scheduledAt,
        metadata = {},
      } = notificationData;

      logger.info('Processing notification request', {
        userId,
        type,
        channels,
        priority,
        templateId,
      });

      // Get user notification preferences if userId is provided
      let userPreferences = null;
      if (userId) {
        userPreferences = await this.getUserPreferences(userId);
      }

      // Determine final channels based on preferences and request
      const finalChannels = await this.determineFinalChannels(
        channels,
        type,
        userPreferences
      );

      logger.info('Final notification channels determined', {
        requestedChannels: channels,
        finalChannels,
        userId,
      });

      // Create notification record
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        channels: finalChannels,
        templateId,
        templateData,
        priority,
        status: scheduledAt ? 'scheduled' : 'pending',
        scheduledAt,
        metadata,
      });

      await notification.save();

      // If notification is scheduled for future, return early
      if (scheduledAt && new Date(scheduledAt) > new Date()) {
        logger.info('Notification scheduled for future delivery', {
          notificationId: notification._id,
          scheduledAt,
        });

        return {
          success: true,
          notificationId: notification._id,
          status: 'scheduled',
          scheduledAt,
        };
      }

      // Send notification through each channel
      const results = await this.sendThroughChannels(
        notification,
        finalChannels,
        userPreferences
      );

      // Update notification status based on results
      const allSuccessful = results.every(r => r.success);
      const anySuccessful = results.some(r => r.success);

      notification.status = allSuccessful ? 'sent' : anySuccessful ? 'partial' : 'failed';
      notification.deliveryResults = results;
      notification.sentAt = new Date();

      await notification.save();

      logger.info('Notification processing completed', {
        notificationId: notification._id,
        status: notification.status,
        results: results.map(r => ({
          channel: r.channel,
          success: r.success,
          error: r.error,
        })),
      });

      return {
        success: anySuccessful,
        notificationId: notification._id,
        status: notification.status,
        results,
      };
    } catch (error) {
      logger.error('Notification sending failed', {
        error: error.message,
        stack: error.stack,
        notificationData,
      });

      throw new Error(`Notification sending failed: ${error.message}`);
    }
  }

  /**
   * Send notifications through specified channels
   * @param {Object} notification - Notification document
   * @param {Array} channels - Channels to send through
   * @param {Object} userPreferences - User notification preferences
   * @returns {Promise<Array>} Array of channel results
   */
  async sendThroughChannels(notification, channels, userPreferences) {
    const results = [];

    for (const channel of channels) {
      try {
        let result;

        switch (channel) {
          case 'email':
            result = await this.sendEmailNotification(notification, userPreferences);
            break;
          case 'sms':
            result = await this.sendSMSNotification(notification, userPreferences);
            break;
          case 'push':
            result = await this.sendPushNotification(notification, userPreferences);
            break;
          default:
            result = {
              success: false,
              channel,
              error: `Unsupported channel: ${channel}`,
            };
        }

        results.push(result);
      } catch (error) {
        logger.error(`Failed to send notification through ${channel}`, {
          error: error.message,
          notificationId: notification._id,
          channel,
        });

        results.push({
          success: false,
          channel,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Send email notification
   * @param {Object} notification - Notification document
   * @param {Object} userPreferences - User preferences
   * @returns {Promise<Object>} Send result
   */
  async sendEmailNotification(notification, userPreferences) {
    try {
      const emailData = {
        to: userPreferences?.email || notification.metadata.email,
        subject: notification.title,
        message: notification.message,
        templateId: notification.templateId,
        templateData: notification.templateData,
        metadata: {
          ...notification.metadata,
          notificationId: notification._id,
          userId: notification.userId,
        },
      };

      const result = await this.emailService.sendEmail(emailData);

      return {
        success: result.success,
        channel: 'email',
        messageId: result.messageId,
        provider: result.provider,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        channel: 'email',
        error: error.message,
      };
    }
  }

  /**
   * Send SMS notification
   * @param {Object} notification - Notification document
   * @param {Object} userPreferences - User preferences
   * @returns {Promise<Object>} Send result
   */
  async sendSMSNotification(notification, userPreferences) {
    try {
      const smsData = {
        to: userPreferences?.phone || notification.metadata.phone,
        message: notification.message,
        templateId: notification.templateId,
        templateData: notification.templateData,
        metadata: {
          ...notification.metadata,
          notificationId: notification._id,
          userId: notification.userId,
        },
      };

      const result = await this.smsService.sendSMS(smsData);

      return {
        success: result.success,
        channel: 'sms',
        messageId: result.messageId,
        provider: result.provider,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        channel: 'sms',
        error: error.message,
      };
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   * @param {Object} notification - Notification document
   * @param {Object} userPreferences - User preferences
   * @returns {Promise<Object>} Send result
   */
  async sendPushNotification(notification, userPreferences) {
    // Placeholder for push notification implementation
    logger.warn('Push notifications not yet implemented', {
      notificationId: notification._id,
    });

    return {
      success: false,
      channel: 'push',
      error: 'Push notifications not yet implemented',
    };
  }

  /**
   * Send bulk notifications
   * @param {Array} notifications - Array of notification data
   * @returns {Promise<Array>} Array of send results
   */
  async sendBulkNotifications(notifications) {
    try {
      const batchSize = config.notifications.batchSize;
      const results = [];

      logger.info('Processing bulk notifications', {
        total: notifications.length,
        batchSize,
      });

      // Process notifications in batches
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const batchPromises = batch.map(notificationData =>
          this.sendNotification(notificationData).catch(error => ({
            success: false,
            error: error.message,
            notificationData,
          }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid overwhelming services
        if (i + batchSize < notifications.length) {
          await this.delay(1000); // 1 second delay between batches
        }
      }

      logger.info('Bulk notifications completed', {
        total: notifications.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      return results;
    } catch (error) {
      logger.error('Bulk notification sending failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      const preferences = await NotificationPreference.findOne({ userId });
      return preferences;
    } catch (error) {
      logger.error('Failed to get user preferences', {
        userId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Update user notification preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Preference updates
   * @returns {Promise<Object>} Updated preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const updatedPreferences = await NotificationPreference.findOneAndUpdate(
        { userId },
        { ...preferences, updatedAt: new Date() },
        { new: true, upsert: true }
      );

      logger.info('User preferences updated', {
        userId,
        preferences: updatedPreferences,
      });

      return updatedPreferences;
    } catch (error) {
      logger.error('Failed to update user preferences', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Determine final channels based on preferences and request
   * @param {Array} requestedChannels - Requested channels
   * @param {string} notificationType - Type of notification
   * @param {Object} userPreferences - User preferences
   * @returns {Promise<Array>} Final channels
   */
  async determineFinalChannels(requestedChannels, notificationType, userPreferences) {
    try {
      if (!userPreferences) {
        // No preferences found, use requested channels
        return requestedChannels;
      }

      const finalChannels = [];

      for (const channel of requestedChannels) {
        // Check if user has opted out of this channel globally
        if (userPreferences.globalOptOut) {
          continue;
        }

        // Check channel-specific preferences
        const channelEnabled = userPreferences.channels?.[channel]?.enabled !== false;
        
        // Check notification type preferences
        const typeEnabled = userPreferences.notificationTypes?.[notificationType]?.[channel] !== false;

        if (channelEnabled && typeEnabled) {
          finalChannels.push(channel);
        }
      }

      return finalChannels;
    } catch (error) {
      logger.error('Failed to determine final channels', {
        requestedChannels,
        notificationType,
        error: error.message,
      });
      
      // Fallback to requested channels on error
      return requestedChannels;
    }
  }

  /**
   * Get notification history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notification history
   */
  async getNotificationHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate,
      } = options;

      const query = { userId };

      if (type) query.type = type;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get notification history', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Notification statistics
   */
  async getNotificationStats(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        userId,
        type,
      } = filters;

      const matchStage = {};

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      if (userId) matchStage.userId = userId;
      if (type) matchStage.type = type;

      const stats = await Notification.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
            partial: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                status: '$status',
              },
            },
          },
        },
      ]);

      // Group by type and status
      const typeStats = {};
      if (stats.length > 0 && stats[0].byType) {
        stats[0].byType.forEach(item => {
          if (!typeStats[item.type]) {
            typeStats[item.type] = {
              total: 0,
              sent: 0,
              failed: 0,
              pending: 0,
              scheduled: 0,
              partial: 0,
            };
          }
          typeStats[item.type].total++;
          typeStats[item.type][item.status]++;
        });
      }

      return {
        overall: stats[0] || {
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          scheduled: 0,
          partial: 0,
        },
        byType: typeStats,
      };
    } catch (error) {
      logger.error('Failed to get notification stats', {
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process scheduled notifications
   * @returns {Promise<number>} Number of notifications processed
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await Notification.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
      }).limit(100); // Process in batches

      logger.info('Processing scheduled notifications', {
        count: scheduledNotifications.length,
      });

      let processed = 0;

      for (const notification of scheduledNotifications) {
        try {
          // Get user preferences
          const userPreferences = notification.userId 
            ? await this.getUserPreferences(notification.userId)
            : null;

          // Send notification through channels
          const results = await this.sendThroughChannels(
            notification,
            notification.channels,
            userPreferences
          );

          // Update notification status
          const allSuccessful = results.every(r => r.success);
          const anySuccessful = results.some(r => r.success);

          notification.status = allSuccessful ? 'sent' : anySuccessful ? 'partial' : 'failed';
          notification.deliveryResults = results;
          notification.sentAt = new Date();

          await notification.save();
          processed++;

          logger.info('Scheduled notification processed', {
            notificationId: notification._id,
            status: notification.status,
          });
        } catch (error) {
          logger.error('Failed to process scheduled notification', {
            notificationId: notification._id,
            error: error.message,
          });

          // Mark as failed
          notification.status = 'failed';
          notification.deliveryResults = [{
            success: false,
            error: error.message,
          }];
          await notification.save();
        }
      }

      logger.info('Scheduled notifications processing completed', {
        processed,
        total: scheduledNotifications.length,
      });

      return processed;
    } catch (error) {
      logger.error('Failed to process scheduled notifications', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NotificationService;
