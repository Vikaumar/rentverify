/**
 * @file User.cjs
 * @description Mongoose schema for Property Guardian credentials and roles.
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'guardian'],
      default: 'guardian',
    },
    name: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    propertyName: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in hot-reload scenarios
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
