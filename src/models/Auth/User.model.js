import mongoose from "mongoose";
import bcrypt from "bcrypt"; // Use bcrypt instead of bcryptjs

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false // Don't include in queries by default
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  role: {
    type: String,
    enum: ["learner", "mentor", "admin"],
    default: "learner",
    index: true
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String, // encrypted TOTP secret
    select: false
  },
  status: {
    type: String,
    enum: ["active", "suspended", "deleted"],
    default: "active",
    index: true
  },
  lastLoginAt: {
    type: Date
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  // Security fields
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  passwordChangedAt: Date
}, { 
  timestamps: true,
  // Add version key for optimistic concurrency
  versionKey: '__v'
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Update passwordChangedAt when password is modified
  if (this.isModified('passwordHash') && !this.isNew) {
    this.passwordChangedAt = new Date();
    this.tokenVersion = (this.tokenVersion || 0) + 1; // Invalidate existing tokens
  }
  
  // Normalize email
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  
  // Normalize name
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.getFailedLoginReasons = function() {
  return {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
  };
};

// Indexes for performance
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ lastLoginAt: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ isEmailVerified: 1, status: 1 });

// Compound index for authentication queries
userSchema.index({ email: 1, status: 1, isEmailVerified: 1 });

export const User = mongoose.model("User", userSchema);
