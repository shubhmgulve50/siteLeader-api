import { ROLE } from '../constants/constants.js';

export const builderScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  // If SUPER_ADMIN, allow access to all data (no filter)
  if (req.user.role === ROLE.SUPER_ADMIN) {
    req.builderFilter = {};
    return next();
  }

  // For all other roles, restrict access to their own builderId
  req.builderFilter = { builderId: req.user.builderId || req.user._id };

  // Note: For a BUILDER, builderId in the document should match their own _id.
  // For SUPERVISOR/WORKER, builderId should match their assigned builderId.
  if (req.user.role === ROLE.BUILDER) {
    req.builderFilter = { builderId: req.user._id };
  } else {
    req.builderFilter = { builderId: req.user.builderId };
  }

  next();
};
