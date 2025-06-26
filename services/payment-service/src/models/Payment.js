const mongoose = require('mongoose');

// Payment status enum
const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

// Payment method enum
const PaymentMethod = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  WALLET: 'wallet',
};

// Payment intent schema
const paymentIntentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  provider: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  },
  providerIntentId: {
    type: String,
    required: true,
  },
  clientSecret: String,
  metadata: {
    type: Map,
    of: String,
  },
}, { _id: false });

// Refund schema
const refundSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    minLength: 3,
    maxLength: 3,
  },
  reason: {
    type: String,
    enum: ['duplicate', 'fraudulent', 'requested_by_customer', 'other'],
    default: 'requested_by_customer',
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending',
  },
  providerRefundId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: Date,
  metadata: {
    type: Map,
    of: String,
  },
}, { _id: false });

// Main payment schema
const paymentSchema = new mongoose.Schema({
  // Core payment information
  orderId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    minLength: 3,
    maxLength: 3,
  },
  
  // Status and method
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true,
  },
  method: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
  },
  
  // Payment intent information
  paymentIntent: paymentIntentSchema,
  
  // Transaction details
  transactionId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  
  // Customer information
  customer: {
    email: String,
    name: String,
    phone: String,
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
  },
  
  // Refund information
  refunds: [refundSchema],
  totalRefunded: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // Fees and charges
  fees: {
    processingFee: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
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
  processedAt: Date,
  
  // Failure information
  failureReason: String,
  failureCode: String,
  
  // Metadata for additional information
  metadata: {
    type: Map,
    of: String,
  },
  
  // Webhook information
  webhookEvents: [{
    eventId: String,
    eventType: String,
    processed: {
      type: Boolean,
      default: false,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
  collection: 'payments',
});

// Indexes for better performance
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ 'paymentIntent.providerIntentId': 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });
paymentSchema.index({ createdAt: -1 });

// Virtual for net amount (amount - totalRefunded)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.totalRefunded;
});

// Virtual for refund availability
paymentSchema.virtual('canRefund').get(function() {
  return this.status === PaymentStatus.COMPLETED && this.netAmount > 0;
});

// Methods
paymentSchema.methods.toJSON = function() {
  const payment = this.toObject({ virtuals: true });
  delete payment.__v;
  return payment;
};

// Method to add refund
paymentSchema.methods.addRefund = function(refundData) {
  this.refunds.push(refundData);
  this.totalRefunded += refundData.amount;
  
  // Update status based on refund amount
  if (this.totalRefunded >= this.amount) {
    this.status = PaymentStatus.REFUNDED;
  } else if (this.totalRefunded > 0) {
    this.status = PaymentStatus.PARTIALLY_REFUNDED;
  }
  
  this.updatedAt = new Date();
  return this.save();
};

// Method to update status
paymentSchema.methods.updateStatus = function(newStatus, metadata = {}) {
  this.status = newStatus;
  this.updatedAt = new Date();
  
  if (newStatus === PaymentStatus.COMPLETED) {
    this.processedAt = new Date();
  }
  
  // Add metadata
  Object.entries(metadata).forEach(([key, value]) => {
    this.metadata.set(key, value);
  });
  
  return this.save();
};

// Static methods
paymentSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId });
};

paymentSchema.statics.findByUserId = function(userId, options = {}) {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;
  
  const query = { userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

paymentSchema.statics.getPaymentStats = function(dateRange = {}) {
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
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
      },
    },
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export the model and enums
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = {
  Payment,
  PaymentStatus,
  PaymentMethod,
};
