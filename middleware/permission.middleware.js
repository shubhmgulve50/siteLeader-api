import User from '../models/user.model.js';
import { ROLE, CORE_MODULES } from '../constants/constants.js';

export const requireModule = (moduleName) => async (req, res, next) => {
  const user = req.user;

  // SUPER_ADMIN has unrestricted access
  if (user.role === ROLE.SUPER_ADMIN) return next();

  // Core modules accessible to all approved+active users
  if (CORE_MODULES.includes(moduleName)) return next();

  // BUILDER: check their own permissions
  if (user.role === ROLE.BUILDER) {
    if (user.permissions?.includes(moduleName)) return next();
    return res.status(403).json({ message: `Access to '${moduleName}' module not granted` });
  }

  // SUPERVISOR / ENGINEER / WORKER: inherit builder's permissions
  if (user.builderId) {
    const builder = await User.findById(user.builderId).select('permissions').lean();
    if (builder?.permissions?.includes(moduleName)) return next();
  }

  return res.status(403).json({ message: `Access to '${moduleName}' module not granted` });
};
