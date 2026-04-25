import User from '../models/user.model.js';
import { generateAccessToken, verifyToken } from '../utils/auth.js';
import { clearAuthCookies, errorResponse, getCookie, setCookie } from '../utils/utils.js';
import HttpError from '../utils/httpError.js';
export const authenticate = async (req, res, next, optional = false) => {
  console.log('authenticate');

  // Helper function to handle authentication errors
  const handleAuthError = (message, status = 401) => {
    if (optional) {
      return next();
    }
    clearAuthCookies(res);
    return errorResponse(res, new HttpError(message, status));
  };

  const accessToken = getCookie(req, 'accessToken');
  const refreshToken = getCookie(req, 'refreshToken');

  console.log('accessToken', accessToken);

  console.log('refreshToken:', refreshToken);

  if (!accessToken) {
    return handleAuthError('Access token missing or invalid');
  }

  try {
    // Verify the token
    const decoded = verifyToken(accessToken, process.env.JWT_SECRET);
    if (!decoded) {
      return handleAuthError('Invalid or expired token');
    }

    console.log('decoded', decoded);

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return handleAuthError('User not found', 404);
    }
    // Add user and device info to request
    req.user = user;

    return next();
  } catch (err) {
    console.log('err', err);
    if (err.name === 'TokenExpiredError' && refreshToken) {
      // Access token expired, try refreshing it
      try {
        // Verify and decode the refresh token
        const decodedRefreshToken = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (!decodedRefreshToken) {
          return handleAuthError('Invalid or expired refresh token', 403);
        }

        // Get user and verify status
        const user = await User.findById(decodedRefreshToken.id);
        if (!user) {
          return handleAuthError('User not found', 404);
        }
        // Generate new access token
        const newAccessToken = generateAccessToken({
          id: user._id,
          role: user.role,
        });
        setCookie(res, 'accessToken', newAccessToken);

        // Add user and device info to request
        req.user = user;
        // req.deviceId = deviceId;

        return next();
      } catch (refreshError) {
        return handleAuthError(
          refreshError.name === 'TokenExpiredError'
            ? 'Refresh token expired. Please log in again'
            : 'Invalid refresh token',
          refreshError.name === 'TokenExpiredError' ? 401 : 403
        );
      }
    }

    return handleAuthError('Invalid access token', 403);
  }
};
