import AuditLog from '../models/auditLog.model.js';

// @route   GET /api/audit-logs
// Query: userId, resource, resourceId, action, from, to, limit
export const getAuditLogs = async (req, res) => {
  try {
    const query = { ...req.builderFilter };
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.resource) query.resource = req.query.resource;
    if (req.query.resourceId) query.resourceId = req.query.resourceId;
    if (req.query.action) query.action = req.query.action;
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
    }
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
