import AuditLog from '../models/auditLog.model.js';

/**
 * Record an audit entry. Non-blocking — never throws to caller.
 * @param {object} req Express request (for user + ip + UA)
 * @param {string} action CREATE/UPDATE/DELETE/APPROVE/REJECT/PAYMENT/TRANSFER
 * @param {string} resource Site / Transaction / Invoice / etc.
 * @param {ObjectId|string|null} resourceId Mongo ID of resource (optional)
 * @param {string} summary Short human-readable description
 * @param {object} changes Snapshot / diff of relevant fields
 */
export const logAudit = async (req, action, resource, resourceId, summary = '', changes = {}) => {
  try {
    const builderId = req.user?.builderId || req.user?._id;
    if (!builderId) return; // auth missing — skip silently

    await AuditLog.create({
      builderId,
      userId: req.user._id,
      userName: req.user.name || req.user.email || '',
      userRole: req.user.role || '',
      action,
      resource,
      resourceId: resourceId || undefined,
      summary,
      changes,
      ip:
        req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        '',
      userAgent: req.headers?.['user-agent'] || '',
    });
  } catch (err) {
    // Audit failures must never break main flow
    console.error('[audit] write failed:', err?.message);
  }
};
