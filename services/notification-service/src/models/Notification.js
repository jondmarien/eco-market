const mongoose = require('mongoose');

// Notification status enum
const NotificationStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRY: 'retry',
};

// Notification type enum
const NotificationType = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
};

// Notification priority enum
const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Notification category enum
const NotificationCategory = {
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_UPDATE: 'order_update',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  PAYMENT_FAILED: 'payment_failed',
  SHIPPING_UPDATE: 'shipping_update',
  DELIVERY_CONFIRMATION: 'delivery_confirmation',
  USER_WELCOME: 'user_welcome',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_VERIFICATION: 'account_verification',
  PROMOTION: 'promotion',
  INVENTORY_ALERT: 'inventory_alert',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SECURITY_ALERT: 'security_alert',
};

// Email content schema
const emailContentSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    maxLength: 255,
  },
  htmlBody: {
    type: String,
    required: true,
  },
  textBody: {
    type: String,
    required: true,
  },
  attachments: [{
    filename: String,
    content: String, // Base64 encoded
    contentType: String,
    size: Number,
  }],
}, { _id: false });

// SMS content schema
const smsContentSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    maxLength: 1600, // Allow for long SMS
  },
  mediaUrls: [String], // For MMS
}, { _id: false });

// Push content schema
const pushContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxLength: 255,
  },
  body: {
    type: String,
    required: true,
    maxLength: 1000,
  },
  icon: String,
  image: String,
  badge: String,
  sound: String,
  clickAction: String,
  data: {
    type: Map,
    of: String,
  },
  actions: [{
    action: String,
    title: String,
    icon: String,
  }],
}, { _id: false });

// Delivery attempt schema
const deliveryAttemptSchema = new mongoose.Schema({
  attemptNumber: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    required: true,
  },
  error: {
    message: String,
    code: String,
    details: String,
  },
  providerResponse: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  duration: Number, // milliseconds
}, { _id: false });

// Main notification schema
const notificationSchema = new mongoose.Schema({
  // Core identification
  notificationId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  
  // Recipient information
  recipientId: {
    type: String,
    required: true,
    index: true,
  },
  recipientEmail: String,
  recipientPhone: String,
  recipientDeviceTokens: [String], // For push notifications
  
  // Notification details
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: Object.values(NotificationCategory),
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.NORMAL,
    index: true,
  },
  
  // Content based on type
  emailContent: emailContentSchema,
  smsContent: smsContentSchema,
  pushContent: pushContentSchema,
  
  // Status and tracking
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true,
  },
  
  // Scheduling
  scheduledAt: {
    type: Date,
    index: true,
  },
  sentAt: Date,
  deliveredAt: Date,
  
  // Retry logic
  maxRetries: {
    type: Number,
    default: 3,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  nextRetryAt: Date,
  
  // Delivery tracking
  deliveryAttempts: [deliveryAttemptSchema],
  
  // Provider information
  provider: {
    email: String, // sendgrid, ses
    sms: String,   // twilio
    push: String,  // fcm, vapid
  },
  providerMessageId: String,
  
  // Template information
  templateId: String,
  templateVersion: String,
  templateData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  
  // Context and metadata
  contextId: String, // Order ID, Payment ID, etc.
  contextType: String, // order, payment, user, etc.
  metadata: {
    type: Map,
    of: String,
  },
  
  // Tracking and analytics
  opened: {
    type: Boolean,
    default: false,
  },
  openedAt: Date,
  clicked: {
    type: Boolean,
    default: false,
  },
  clickedAt: Date,
  unsubscribed: {
    type: Boolean,
    default: false,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: true,
  collection: 'notifications',
});

// Indexes for better performance
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ category: 1, createdAt: -1 });
notificationSchema.index({ contextId: 1, contextType: 1 });
notificationSchema.index({ priority: 1, status: 1 });
notificationSchema.index({ nextRetryAt: 1 }, { sparse: true });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for checking if notification can be retried
notificationSchema.virtual('canRetry').get(function() {
  return this.retryCount < this.maxRetries && 
         this.status === NotificationStatus.FAILED &&
         !this.isExpired;
});

// Virtual for next scheduled time
notificationSchema.virtual('shouldBeSent').get(function() {
  const now = new Date();
  return this.status === NotificationStatus.PENDING &&
         (!this.scheduledAt || this.scheduledAt <= now) &&
         !this.isExpired;
});

// Methods
notificationSchema.methods.toJSON = function() {
  const notification = this.toObject({ virtuals: true });
  delete notification.__v;
  return notification;
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function(providerResponse = {}) {
  this.status = NotificationStatus.SENT;
  this.sentAt = new Date();
  this.providerMessageId = providerResponse.messageId;
  this.updatedAt = new Date();
  
  // Add delivery attempt
  this.deliveryAttempts.push({
    attemptNumber: this.retryCount + 1,
    status: NotificationStatus.SENT,
    providerResponse: providerResponse,
  });
  
  return this.save();
};

// Method to mark as failed
notificationSchema.methods.markAsFailed = function(error, providerResponse = {}) {
  this.status = NotificationStatus.FAILED;
  this.retryCount += 1;
  this.updatedAt = new Date();
  
  // Add delivery attempt
  this.deliveryAttempts.push({
    attemptNumber: this.retryCount,
    status: NotificationStatus.FAILED,
    error: {
      message: error.message,
      code: error.code,
      details: error.stack,
    },
    providerResponse: providerResponse,
  });
  
  // Set next retry time if retries are available
  if (this.canRetry) {
    const retryDelay = Math.pow(2, this.retryCount) * 60 * 1000; // Exponential backoff
    this.nextRetryAt = new Date(Date.now() + retryDelay);
    this.status = NotificationStatus.RETRY;
  }
  
  return this.save();
};

// Method to mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.status = NotificationStatus.DELIVERED;
  this.deliveredAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Method to track opening
notificationSchema.methods.trackOpen = function() {
  if (!this.opened) {
    this.opened = true;
    this.openedAt = new Date();
    this.updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to track clicking
notificationSchema.methods.trackClick = function() {
  if (!this.clicked) {
    this.clicked = true;
    this.clickedAt = new Date();
    this.updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
notificationSchema.statics.findPendingNotifications = function(limit = 100) {
  const now = new Date();
  return this.find({
    status: { $in: [NotificationStatus.PENDING, NotificationStatus.RETRY] },
    $or: [
      { scheduledAt: { $lte: now } },
      { scheduledAt: { $exists: false } },
      { nextRetryAt: { $lte: now } },
    ],
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: { $exists: false } },
    ],
  })
  .sort({ priority: -1, createdAt: 1 })
  .limit(limit);
};

notificationSchema.statics.findByRecipient = function(recipientId, options = {}) {
  const { page = 1, limit = 20, category, status, type } = options;
  const skip = (page - 1) * limit;
  
  const query = { recipientId };
  if (category) query.category = category;
  if (status) query.status = status;
  if (type) query.type = type;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

notificationSchema.statics.getNotificationStats = function(dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          status: '$status',
          type: '$type',
          category: '$category',
        },
        count: { $sum: 1 },
        avgRetries: { $avg: '$retryCount' },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        byStatus: {
          $push: {
            status: '$_id.status',
            count: '$count',
          },
        },
        byType: {
          $push: {
            type: '$_id.type',
            count: '$count',
          },
        },
        byCategory: {
          $push: {
            category: '$_id.category',
            count: '$count',
          },
        },
        avgRetries: { $avg: '$avgRetries' },
      },
    },
  ]);
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export the model and enums
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  Notification,
  NotificationStatus,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
};
