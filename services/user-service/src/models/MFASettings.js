const mongoose = require('mongoose');
const speakeasy = require('speakeasy');

const mfaSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  methods: {
    totp: {
      enabled: {
        type: Boolean,
        default: false
      },
      secret: {
        type: String,
        select: false
      },
      backupCodes: {
        type: [String],
        select: false,
        default: []
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      phoneNumber: {
        type: String,
        trim: true
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      verified: {
        type: Boolean,
        default: false
      }
    }
  },
  lastUsed: {
    type: Date
  },
  lastBackupCodeUsed: {
    type: Date
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
mfaSettingsSchema.index({ userId: 1 });
mfaSettingsSchema.index({ isEnabled: 1 });

// Virtual to check if MFA is locked
mfaSettingsSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// Instance method to generate TOTP secret
mfaSettingsSchema.methods.generateTOTPSecret = function() {
  const secret = speakeasy.generateSecret({
    name: `EcoMarket (${this.userId})`,
    issuer: 'EcoMarket',
    length: 32
  });
  
  this.methods.totp.secret = secret.base32;
  return {
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url,
    manualEntryKey: secret.base32
  };
};

// Instance method to verify TOTP token
mfaSettingsSchema.methods.verifyTOTP = function(token) {
  if (!this.methods.totp.secret) {
    return false;
  }

  return speakeasy.totp.verify({
    secret: this.methods.totp.secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps (60 seconds) of variance
  });
};

// Instance method to generate backup codes
mfaSettingsSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  this.methods.totp.backupCodes = codes;
  return codes;
};

// Instance method to verify backup code
mfaSettingsSchema.methods.verifyBackupCode = function(code) {
  const index = this.methods.totp.backupCodes.indexOf(code.toUpperCase());
  if (index === -1) {
    return false;
  }
  
  // Remove used backup code
  this.methods.totp.backupCodes.splice(index, 1);
  this.lastBackupCodeUsed = new Date();
  return true;
};

// Instance method to enable MFA
mfaSettingsSchema.methods.enableMFA = function() {
  this.isEnabled = true;
  this.methods.totp.enabled = true;
  this.methods.totp.verified = true;
  this.failedAttempts = 0;
  this.lockedUntil = undefined;
};

// Instance method to disable MFA
mfaSettingsSchema.methods.disableMFA = function() {
  this.isEnabled = false;
  this.methods.totp.enabled = false;
  this.methods.totp.verified = false;
  this.methods.totp.secret = undefined;
  this.methods.totp.backupCodes = [];
  this.methods.sms.enabled = false;
  this.methods.email.enabled = false;
  this.failedAttempts = 0;
  this.lockedUntil = undefined;
};

// Instance method to increment failed attempts
mfaSettingsSchema.methods.incrementFailedAttempts = function() {
  this.failedAttempts = (this.failedAttempts || 0) + 1;
  
  // Lock MFA for 1 hour after 5 failed attempts
  if (this.failedAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  }
  
  return this.save();
};

// Instance method to reset failed attempts
mfaSettingsSchema.methods.resetFailedAttempts = function() {
  this.failedAttempts = 0;
  this.lockedUntil = undefined;
  this.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('MFASettings', mfaSettingsSchema);
