const twilio = require('twilio');
const config = require('../config/config');
const logger = require('../middleware/logger');

class SMSService {
  constructor() {
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
      this.provider = 'twilio';
    } else {
      logger.warn('No SMS service configured');
      this.provider = null;
    }
  }

  /**
   * Send an SMS message
   * @param {Object} smsData - SMS data
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(smsData) {
    try {
      const {
        to,
        message,
        mediaUrls = [],
        templateId,
        templateData = {},
        metadata = {},
      } = smsData;

      if (!this.provider) {
        throw new Error('No SMS provider configured');
      }

      // Validate phone number format
      if (!this.validatePhoneNumber(to)) {
        throw new Error('Invalid phone number format');
      }

      let finalMessage = message;

      // If template is specified, compile it
      if (templateId) {
        const template = await this.getTemplate(templateId);
        if (template) {
          finalMessage = this.compileTemplate(template.message, templateData);
        }
      }

      // Validate message length
      if (finalMessage.length > config.notifications.smsMaxLength) {
        logger.warn('SMS message truncated due to length', {
          originalLength: finalMessage.length,
          maxLength: config.notifications.smsMaxLength,
        });
        finalMessage = finalMessage.substring(0, config.notifications.smsMaxLength - 3) + '...';
      }

      // Prepare SMS message
      const messageOptions = {
        body: finalMessage,
        to: to,
        from: config.twilio.fromPhone || config.twilio.messagingServiceSid,
      };

      // Use messaging service if available
      if (config.twilio.messagingServiceSid) {
        messageOptions.messagingServiceSid = config.twilio.messagingServiceSid;
        delete messageOptions.from;
      }

      // Add media URLs for MMS
      if (mediaUrls && mediaUrls.length > 0) {
        messageOptions.mediaUrl = mediaUrls;
      }

      logger.info('Sending SMS', {
        to: to,
        messageLength: finalMessage.length,
        provider: this.provider,
        templateId,
        hasMedia: mediaUrls.length > 0,
      });

      // Send SMS via Twilio
      const result = await this.client.messages.create(messageOptions);

      logger.info('SMS sent successfully', {
        to: to,
        messageSid: result.sid,
        status: result.status,
        provider: this.provider,
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        provider: this.provider,
        response: result,
      };
    } catch (error) {
      logger.error('SMS sending failed', {
        error: error.message,
        code: error.code,
        to: smsData.to,
        message: smsData.message,
      });

      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Send bulk SMS messages
   * @param {Array} smsList - Array of SMS data objects
   * @returns {Promise<Array>} Array of send results
   */
  async sendBulkSMS(smsList) {
    try {
      const batchSize = config.notifications.smsBatchSize;
      const results = [];

      // Process SMS in batches
      for (let i = 0; i < smsList.length; i += batchSize) {
        const batch = smsList.slice(i, i + batchSize);
        const batchPromises = batch.map(smsData => 
          this.sendSMS(smsData).catch(error => ({
            success: false,
            error: error.message,
            smsData,
          }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < smsList.length) {
          await this.delay(2000); // 2 second delay for SMS
        }
      }

      logger.info('Bulk SMS sending completed', {
        total: smsList.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      return results;
    } catch (error) {
      logger.error('Bulk SMS sending failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get SMS template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template data
   */
  async getTemplate(templateId) {
    try {
      // Load template from storage
      const template = await this.loadTemplate(templateId);
      return template;
    } catch (error) {
      logger.error('Failed to get SMS template', { templateId, error: error.message });
      return null;
    }
  }

  /**
   * Load SMS template from storage
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template data
   */
  async loadTemplate(templateId) {
    // Predefined SMS templates
    const templates = {
      'order-confirmation': {
        message: 'Hi {{customerName}}! Your EcoMarket order #{{orderNumber}} has been confirmed. Total: ${{orderTotal}}. Track at {{orderUrl}}',
      },
      'payment-confirmation': {
        message: 'Payment received for order #{{orderNumber}}! Amount: ${{paymentAmount}} via {{paymentMethod}}. Your order is being processed.',
      },
      'shipping-update': {
        message: 'Great news! Your order #{{orderNumber}} has shipped. Tracking: {{trackingNumber}}. Estimated delivery: {{estimatedDelivery}}',
      },
      'delivery-confirmation': {
        message: 'Your EcoMarket order #{{orderNumber}} has been delivered! We hope you love your sustainable products. Rate your experience: {{reviewUrl}}',
      },
      'password-reset': {
        message: 'Your EcoMarket password reset code is: {{resetCode}}. This code expires in 15 minutes. Don\'t share this code with anyone.',
      },
      'account-verification': {
        message: 'Welcome to EcoMarket! Your verification code is: {{verificationCode}}. Enter this code to complete your account setup.',
      },
      'low-stock-alert': {
        message: 'Hurry! Only {{stockCount}} left of {{productName}}. Get yours before it\'s gone: {{productUrl}}',
      },
      'promotion': {
        message: '🌱 Special offer! {{promoText}} Use code {{promoCode}} at checkout. Valid until {{expiryDate}}. Shop now: {{shopUrl}}',
      },
      'appointment-reminder': {
        message: 'Reminder: Your appointment is tomorrow at {{appointmentTime}}. Location: {{location}}. Questions? Call {{supportPhone}}',
      },
    };

    return templates[templateId] || null;
  }

  /**
   * Compile template with data
   * @param {string} template - Template string
   * @param {Object} data - Template data
   * @returns {string} Compiled template
   */
  compileTemplate(template, data) {
    try {
      let compiled = template;
      
      // Simple template replacement (since handlebars might be overkill for SMS)
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        compiled = compiled.replace(regex, data[key] || '');
      });

      return compiled;
    } catch (error) {
      logger.error('SMS template compilation failed', { error: error.message });
      return template; // Return original template if compilation fails
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number
   * @returns {boolean} Is valid phone number
   */
  validatePhoneNumber(phoneNumber) {
    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Phone number
   * @param {string} countryCode - Country code (default: +1 for US)
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber, countryCode = '+1') {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with country code, add it
    if (!phoneNumber.startsWith('+')) {
      if (digits.length === 10 && countryCode === '+1') {
        return `+1${digits}`;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
      } else {
        return `${countryCode}${digits}`;
      }
    }
    
    return phoneNumber;
  }

  /**
   * Get message delivery status
   * @param {string} messageSid - Twilio message SID
   * @returns {Promise<Object>} Message status
   */
  async getMessageStatus(messageSid) {
    try {
      if (!this.provider) {
        throw new Error('No SMS provider configured');
      }

      const message = await this.client.messages(messageSid).fetch();
      
      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        price: message.price,
        priceUnit: message.priceUnit,
      };
    } catch (error) {
      logger.error('Failed to get message status', {
        messageSid,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process webhook events from SMS provider
   * @param {Object} event - Webhook event
   * @returns {Promise<boolean>} Processing result
   */
  async processWebhookEvent(event) {
    try {
      logger.info('Processing SMS webhook event', {
        messageSid: event.MessageSid,
        messageStatus: event.MessageStatus,
        to: event.To,
      });

      // Handle different Twilio SMS statuses
      switch (event.MessageStatus) {
        case 'sent':
          await this.handleSentEvent(event);
          break;
        case 'delivered':
          await this.handleDeliveredEvent(event);
          break;
        case 'undelivered':
        case 'failed':
          await this.handleFailureEvent(event);
          break;
        default:
          logger.info('Unhandled SMS webhook event', { 
            messageStatus: event.MessageStatus 
          });
      }

      return true;
    } catch (error) {
      logger.error('SMS webhook processing failed', {
        error: error.message,
        event,
      });
      return false;
    }
  }

  /**
   * Handle sent event
   * @param {Object} event - Webhook event
   */
  async handleSentEvent(event) {
    logger.info('SMS sent', {
      messageSid: event.MessageSid,
      to: event.To,
    });
  }

  /**
   * Handle delivered event
   * @param {Object} event - Webhook event
   */
  async handleDeliveredEvent(event) {
    logger.info('SMS delivered', {
      messageSid: event.MessageSid,
      to: event.To,
    });
  }

  /**
   * Handle failure event
   * @param {Object} event - Webhook event
   */
  async handleFailureEvent(event) {
    logger.warn('SMS delivery failed', {
      messageSid: event.MessageSid,
      to: event.To,
      errorCode: event.ErrorCode,
      errorMessage: event.ErrorMessage,
    });
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

module.exports = SMSService;
