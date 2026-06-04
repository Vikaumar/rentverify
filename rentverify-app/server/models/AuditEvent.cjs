const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    verificationId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: [
        'link_sent',
        'details_submitted',
        'selfie_uploaded',
        'id_uploaded',
        'submission_complete',
        'guardian_viewed',
        'approved',
        'rejected',
        'flagged',
        'sms_sent',
        'whatsapp_sent',
        'escalation_sent',
      ],
      required: true,
    },
    actor: {
      type: String,
      enum: ['guest', 'guardian', 'system'],
      required: true,
    },
    description: { type: String, required: true },
    timestamp: { type: String, required: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    collection: 'audit_events',
  }
);

// Compound index for efficient queries
auditEventSchema.index({ verificationId: 1, timestamp: 1 });

module.exports = mongoose.model('AuditEvent', auditEventSchema);
