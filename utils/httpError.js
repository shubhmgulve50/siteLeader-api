class HttpError extends Error {
  constructor(message, statusCode = 500, errorData = null) {
    super(message);
    this.status = statusCode;
    this.statusCode = statusCode;
    this.errorData = errorData;
    Error.captureStackTrace(this, this.constructor);
  }
}
export default HttpError;
