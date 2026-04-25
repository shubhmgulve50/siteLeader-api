import { ROLE } from '../constants/constants.js';
import HttpError from './httpError.js';
import { errorResponse } from './utils.js';

const isSuperAdmin = (req, res, next, optional = false) => {
  if (!optional && req.user.role !== ROLE.ADMIN) {
    return errorResponse(res, new HttpError('Access denied', 403));
  }

  next();
};

export { isSuperAdmin };
