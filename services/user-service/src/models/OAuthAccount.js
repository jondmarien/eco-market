const mongoose = require('mongoose');

const oAuthAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['google', 'github', 'facebook', 'linkedin'],
    required: true
  },
  providerId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  profilePhoto: {
    type: String
  },
  accessToken: {
    type: String,
    select: false // Don't include in query results by default
  },
  refreshToken: {
    type: String,
    select: false
  },
  tokenExpiresAt: {
    type: Date
  },
  scope: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate accounts
oAuthAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true });
oAuthAccountSchema.index({ userId: 1, provider: 1 });
oAuthAccountSchema.index({ email: 1, provider: 1 });

// Instance method to update last used
oAuthAccountSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

// Static method to find or create OAuth account
oAuthAccountSchema.statics.findOrCreate = async function(profile, userId) {
  const existing = await this.findOne({
    provider: profile.provider,
    providerId: profile.id
  });

  if (existing) {
    // Update existing account with latest info
    existing.email = profile.emails?.[0]?.value || existing.email;
    existing.displayName = profile.displayName || existing.displayName;
    existing.profilePhoto = profile.photos?.[0]?.value || existing.profilePhoto;
    existing.lastUsed = new Date();
    await existing.save();
    return existing;
  }

  // Create new OAuth account
  return this.create({
    userId,
    provider: profile.provider,
    providerId: profile.id,
    email: profile.emails?.[0]?.value,
    displayName: profile.displayName,
    profilePhoto: profile.photos?.[0]?.value,
    lastUsed: new Date()
  });
};

module.exports = mongoose.model('OAuthAccount', oAuthAccountSchema);
