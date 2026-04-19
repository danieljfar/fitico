import { ApiError } from '../utils/apiError.js';

export function errorMiddleware(error, req, res, next) {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
    },
  });
}