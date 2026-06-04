const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    refCode: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true,
    },
    guestName: { type: String, required: true },
    guestPhone: { type: String, required: true },
    guestEmail: { type: String, default: null },
    guestCount: { type: Number, default: 1 },
    purpose: { type: String, required: true },
    bookingPlatform: { type: String, default: null },
    selfieData: { type: String, default: null },
    idType: { type: String, required: true },
    idImageData: { type: String, default: null },
    checkinDate: { type: String, required: true },
    checkinTime: { type: String, required: true },
    checkoutDate: { type: String, required: true },
    checkoutTime: { type: String, required: true },
    submittedAt: { type: String, required: true, index: true },
    reviewedAt: { type: String, default: null },
    reviewedBy: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    flagReason: { type: String, default: null },
    guardianNote: { type: String, default: null },
    linkToken: { type: String, required: true },
    linkExpiresAt: { type: String, required: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'verifications',
  }
);

// Text index for search functionality
verificationSchema.index({
  guestName: 'text',
  guestPhone: 'text',
  refCode: 'text',
  guestEmail: 'text',
});

module.exports = mongoose.model('Verification', verificationSchema);
