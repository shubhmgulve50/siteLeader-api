import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, default: '' },
    userRole: { type: String, default: '' },
    action: {
      type: String,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'APPROVE',
        'REJECT',
        'PAYMENT',
        'TRANSFER',
        'LOGIN',
        'LOGOUT',
      ],
      required: true,
    },
    resource: {
      type: String,
      required: true,
      // e.g. Site / Transaction / Invoice / RaBill / Quotation / Vendor / Material / Labour / Equipment / Milestone / Document
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    summary: { type: String, default: '' },
    // Snapshot of changed fields (diff or relevant metadata)
    changes: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ builderId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
