const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: mongoose.Schema.Types.ObjectId,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
