const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in query results by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin', 'super_admin'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  profile: {
    avatar: {
      type: String,
      default: null
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    sustainabilityPreferences: {
      carbonNeutralOnly: {
        type: Boolean,
        default: false
      },
      organicOnly: {
        type: Boolean,
        default: false
      },
      localOnly: {
        type: Boolean,
        default: false
      },
      maxCarbonFootprint: {
        type: Number,
        min: 0
      }
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1
      },
      $set: {
        loginAttempts: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have reached max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Lock for 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Static method to get authentication failures
userSchema.statics.getAuthenticated = function(email, password) {
  return this.findOne({ email, isActive: true }).select('+password').then(user => {
    if (!user) {
      return Promise.resolve(null);
    }
    
    // Check if the account is currently locked
    if (user.isLocked) {
      return user.incLoginAttempts().then(() => {
        const error = new Error('Account temporarily locked due to too many failed login attempts');
        error.code = 'ACCOUNT_LOCKED';
        return Promise.reject(error);
      });
    }
    
    // Test for a matching password
    return user.comparePassword(password).then(isMatch => {
      if (isMatch) {
        // If there's no lock or failed attempts, just return the user
        if (!user.loginAttempts && !user.lockUntil) {
          user.lastLogin = new Date();
          return user.save().then(() => user);
        }
        
        // Reset attempts and remove lock
        const updates = {
          $unset: {
            loginAttempts: 1,
            lockUntil: 1
          },
          $set: {
            lastLogin: new Date()
          }
        };
        
        return user.updateOne(updates).then(() => user);
      }
      
      // Password is incorrect, so increment login attempts
      return user.incLoginAttempts().then(() => {
        const error = new Error('Invalid credentials');
        error.code = 'INVALID_CREDENTIALS';
        return Promise.reject(error);
      });
    });
  });
};

module.exports = mongoose.model('User', userSchema);
