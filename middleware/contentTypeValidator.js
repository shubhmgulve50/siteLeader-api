export const validateContentType = (req, res, next) => {
  const contentType = req.headers['content-type'];

  // Skip validation for GET/DELETE requests as they don't have a body
  if (['GET', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Allow multipart/form-data for file uploads
  if (contentType && contentType.includes('multipart/form-data')) {
    return next();
  }

  // Require application/json for other POST/PUT/PATCH requests
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type must be application/json or multipart/form-data',
    });
  }

  next();
};
