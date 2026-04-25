import HttpError from '../utils/httpError.js';
import { errorResponse } from '../utils/utils.js';

/**
 * Middleware to validate request data against Joi schema.
 * Supports both JSON and multipart/form-data requests.
 *
 * @param {Object} schema - Joi schema to validate against.
 * @param {string} property - The request property to validate (default: "body").
 */
export const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      // Handle multipart/form-data requests by extracting body fields
      const dataToValidate =
        req.is('multipart/form-data') && property === 'body' ? { ...req.body } : req[property];

      const { error } = schema.validate(dataToValidate, {
        abortEarly: false,
        allowUnknown: true, // Allow unknown keys (useful for file uploads)
      });

      if (!error) return next();

      // Map errors to a structured format
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));

      // Construct a detailed error message
      const errorMessage = errors.map((err) => `${err.field}: ${err.message}`).join('; ');

      return errorResponse(res, new HttpError(errorMessage, 400), { errors });
    } catch (err) {
      return errorResponse(res, new HttpError(`Validation error: ${err.message}`, 400));
    }
  };
};
