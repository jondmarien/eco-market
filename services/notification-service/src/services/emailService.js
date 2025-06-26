const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const mjml = require('mjml');
const config = require('../config/config');
const logger = require('../middleware/logger');

class EmailService {
  constructor() {
    if (config.sendgrid.apiKey) {
      sgMail.setApiKey(config.sendgrid.apiKey);
      this.provider = 'sendgrid';
    } else {
      logger.warn('No email service configured');
      this.provider = null;
    }
    
    // Template cache
    this.templateCache = new Map();
  }

  /**
   * Send an email
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(emailData) {
    try {
      const {
        to,
        subject,
        htmlBody,
        textBody,
        attachments = [],
        templateId,
        templateData = {},
        metadata = {},
      } = emailData;

      if (!this.provider) {
        throw new Error('No email provider configured');
      }

      let finalHtmlBody = htmlBody;
      let finalTextBody = textBody;
      let finalSubject = subject;

      // If template is specified, compile it
      if (templateId) {
        const template = await this.getTemplate(templateId);
        if (template) {
          finalHtmlBody = this.compileTemplate(template.html, templateData);
          finalTextBody = this.compileTemplate(template.text, templateData);
          finalSubject = this.compileTemplate(template.subject, templateData);
        }
      }

      // Compile MJML if present
      if (finalHtmlBody && finalHtmlBody.includes('<mjml>')) {
        const mjmlResult = mjml(finalHtmlBody);
        if (mjmlResult.errors.length === 0) {
          finalHtmlBody = mjmlResult.html;
        } else {
          logger.warn('MJML compilation errors', { errors: mjmlResult.errors });
        }
      }

      // Prepare email message
      const message = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: config.sendgrid.fromEmail,
          name: config.sendgrid.fromName,
        },
        replyTo: config.sendgrid.replyToEmail,
        subject: config.notifications.emailSubjectPrefix + finalSubject,
        html: finalHtmlBody,
        text: finalTextBody,
        customArgs: {
          ...metadata,
          service: 'notification-service',
        },
        trackingSettings: {
          clickTracking: {
            enable: true,
            enableText: false,
          },
          openTracking: {
            enable: true,
          },
          subscriptionTracking: {
            enable: true,
            text: 'If you would like to unsubscribe and stop receiving these emails click here: <%click here%>.',
            html: '<p>If you would like to unsubscribe and stop receiving these emails <% click here %>.</p>',
          },
        },
      };

      // Add attachments if any
      if (attachments && attachments.length > 0) {
        message.attachments = attachments.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: 'attachment',
        }));
      }

      logger.info('Sending email', {
        to: message.to,
        subject: finalSubject,
        provider: this.provider,
        templateId,
      });

      // Send email via SendGrid
      const response = await sgMail.send(message);

      logger.info('Email sent successfully', {
        to: message.to,
        messageId: response[0].headers['x-message-id'],
        provider: this.provider,
      });

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        provider: this.provider,
        response: response[0],
      };
    } catch (error) {
      logger.error('Email sending failed', {
        error: error.message,
        code: error.code,
        to: emailData.to,
        subject: emailData.subject,
      });

      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Send bulk emails
   * @param {Array} emailList - Array of email data objects
   * @returns {Promise<Array>} Array of send results
   */
  async sendBulkEmails(emailList) {
    try {
      const batchSize = config.notifications.emailBatchSize;
      const results = [];

      // Process emails in batches
      for (let i = 0; i < emailList.length; i += batchSize) {
        const batch = emailList.slice(i, i + batchSize);
        const batchPromises = batch.map(emailData => 
          this.sendEmail(emailData).catch(error => ({
            success: false,
            error: error.message,
            emailData,
          }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < emailList.length) {
          await this.delay(1000); // 1 second delay
        }
      }

      logger.info('Bulk email sending completed', {
        total: emailList.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });

      return results;
    } catch (error) {
      logger.error('Bulk email sending failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get email template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template data
   */
  async getTemplate(templateId) {
    try {
      // Check cache first
      if (config.notifications.templateCacheEnabled && this.templateCache.has(templateId)) {
        const cached = this.templateCache.get(templateId);
        if (cached.expiresAt > Date.now()) {
          return cached.template;
        } else {
          this.templateCache.delete(templateId);
        }
      }

      // Load template from database or file system
      const template = await this.loadTemplate(templateId);
      
      if (template && config.notifications.templateCacheEnabled) {
        // Cache the template
        this.templateCache.set(templateId, {
          template,
          expiresAt: Date.now() + (config.notifications.templateCacheTTL * 1000),
        });
      }

      return template;
    } catch (error) {
      logger.error('Failed to get template', { templateId, error: error.message });
      return null;
    }
  }

  /**
   * Load template from storage
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template data
   */
  async loadTemplate(templateId) {
    // This would typically load from a database or file system
    // For now, return predefined templates
    const templates = {
      'order-confirmation': {
        subject: 'Order Confirmation - #{{orderNumber}}',
        html: `
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text font-size="20px" color="#333" font-weight="bold">
                    Order Confirmation
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Hi {{customerName}},
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Thank you for your order! Your order #{{orderNumber}} has been confirmed.
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Order Total: ${{orderTotal}}
                  </mj-text>
                  <mj-button background-color="#007bff" href="{{orderUrl}}">
                    View Order Details
                  </mj-button>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `,
        text: `Hi {{customerName}},

Thank you for your order! Your order #{{orderNumber}} has been confirmed.

Order Total: ${{orderTotal}}

View your order details at: {{orderUrl}}

Thank you for shopping with EcoMarket!`,
      },
      'payment-confirmation': {
        subject: 'Payment Received - Order #{{orderNumber}}',
        html: `
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text font-size="20px" color="#333" font-weight="bold">
                    Payment Received
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Hi {{customerName}},
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    We've received your payment for order #{{orderNumber}}.
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Payment Amount: ${{paymentAmount}}
                    Payment Method: {{paymentMethod}}
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Your order is now being processed and will ship soon.
                  </mj-text>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `,
        text: `Hi {{customerName}},

We've received your payment for order #{{orderNumber}}.

Payment Amount: ${{paymentAmount}}
Payment Method: {{paymentMethod}}

Your order is now being processed and will ship soon.

Thank you for shopping with EcoMarket!`,
      },
      'shipping-update': {
        subject: 'Your Order Has Shipped - #{{orderNumber}}',
        html: `
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text font-size="20px" color="#333" font-weight="bold">
                    Order Shipped
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Hi {{customerName}},
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Great news! Your order #{{orderNumber}} has shipped.
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Tracking Number: {{trackingNumber}}
                    Estimated Delivery: {{estimatedDelivery}}
                  </mj-text>
                  <mj-button background-color="#28a745" href="{{trackingUrl}}">
                    Track Your Package
                  </mj-button>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `,
        text: `Hi {{customerName}},

Great news! Your order #{{orderNumber}} has shipped.

Tracking Number: {{trackingNumber}}
Estimated Delivery: {{estimatedDelivery}}

Track your package at: {{trackingUrl}}

Thank you for shopping with EcoMarket!`,
      },
      'welcome': {
        subject: 'Welcome to EcoMarket!',
        html: `
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text font-size="20px" color="#333" font-weight="bold">
                    Welcome to EcoMarket!
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Hi {{userName}},
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Welcome to EcoMarket! We're excited to have you join our community of eco-conscious shoppers.
                  </mj-text>
                  <mj-text font-size="16px" color="#555">
                    Start exploring our sustainable products and make a positive impact on the environment.
                  </mj-text>
                  <mj-button background-color="#007bff" href="{{shopUrl}}">
                    Start Shopping
                  </mj-button>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `,
        text: `Hi {{userName}},

Welcome to EcoMarket! We're excited to have you join our community of eco-conscious shoppers.

Start exploring our sustainable products and make a positive impact on the environment.

Start shopping at: {{shopUrl}}

Welcome to the EcoMarket family!`,
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
      const compiled = handlebars.compile(template);
      return compiled(data);
    } catch (error) {
      logger.error('Template compilation failed', { error: error.message });
      return template; // Return original template if compilation fails
    }
  }

  /**
   * Validate email address
   * @param {string} email - Email address
   * @returns {boolean} Is valid email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Process webhook events from email provider
   * @param {Object} event - Webhook event
   * @returns {Promise<boolean>} Processing result
   */
  async processWebhookEvent(event) {
    try {
      logger.info('Processing email webhook event', {
        eventType: event.event,
        messageId: event.sg_message_id,
      });

      // Handle different SendGrid events
      switch (event.event) {
        case 'delivered':
          await this.handleDeliveredEvent(event);
          break;
        case 'open':
          await this.handleOpenEvent(event);
          break;
        case 'click':
          await this.handleClickEvent(event);
          break;
        case 'bounce':
        case 'dropped':
          await this.handleFailureEvent(event);
          break;
        case 'unsubscribe':
          await this.handleUnsubscribeEvent(event);
          break;
        default:
          logger.info('Unhandled email webhook event', { eventType: event.event });
      }

      return true;
    } catch (error) {
      logger.error('Email webhook processing failed', {
        error: error.message,
        event,
      });
      return false;
    }
  }

  /**
   * Handle delivered event
   * @param {Object} event - Webhook event
   */
  async handleDeliveredEvent(event) {
    // Update notification status in database
    // This would typically involve finding the notification by message ID
    // and updating its status to delivered
    logger.info('Email delivered', {
      messageId: event.sg_message_id,
      email: event.email,
    });
  }

  /**
   * Handle open event
   * @param {Object} event - Webhook event
   */
  async handleOpenEvent(event) {
    logger.info('Email opened', {
      messageId: event.sg_message_id,
      email: event.email,
      timestamp: event.timestamp,
    });
  }

  /**
   * Handle click event
   * @param {Object} event - Webhook event
   */
  async handleClickEvent(event) {
    logger.info('Email clicked', {
      messageId: event.sg_message_id,
      email: event.email,
      url: event.url,
      timestamp: event.timestamp,
    });
  }

  /**
   * Handle failure event
   * @param {Object} event - Webhook event
   */
  async handleFailureEvent(event) {
    logger.warn('Email delivery failed', {
      messageId: event.sg_message_id,
      email: event.email,
      reason: event.reason,
      event: event.event,
    });
  }

  /**
   * Handle unsubscribe event
   * @param {Object} event - Webhook event
   */
  async handleUnsubscribeEvent(event) {
    logger.info('Email unsubscribe', {
      messageId: event.sg_message_id,
      email: event.email,
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

module.exports = EmailService;
