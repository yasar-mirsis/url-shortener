import { Request, Response, NextFunction } from 'express';
import {
  UrlValidationError,
  UrlConflictError,
  UrlNotFoundError
} from '../services/urlService';

/**
 * Error response structure
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

/**
 * Error code mapping for consistent error responses
 */
const ERROR_CODES: Record<string, string> = {
  UrlValidationError: 'INVALID_INPUT',
  UrlConflictError: 'CONFLICT',
  UrlNotFoundError: 'NOT_FOUND',
  SyntaxError: 'BAD_REQUEST',
  RangeError: 'BAD_REQUEST',
  TypeError: 'BAD_REQUEST'
};

/**
 * Error message mapping for user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  UrlValidationError: 'Invalid input provided',
  UrlConflictError: 'Resource already exists',
  UrlNotFoundError: 'Resource not found',
  SyntaxError: 'Invalid request format',
  RangeError: 'Invalid parameter value',
  TypeError: 'Invalid parameter type'
};

/**
 * Format an error into a consistent JSON response structure
 */
const formatError = (
  error: Error,
  statusCode: number
): ErrorResponse => {
  const errorCode = ERROR_CODES[error.name] || 'INTERNAL_ERROR';
  const errorMessage = ERROR_MESSAGES[error.name] || 'Internal server error';

  const response: ErrorResponse = {
    error: {
      code: errorCode,
      message: errorMessage
    }
  };

  // Add details for validation errors
  if (error instanceof UrlValidationError && 'details' in error) {
    response.error.details = (error as any).details;
  }

  return response;
};

/**
 * Get HTTP status code for error type
 */
const getStatusCode = (error: Error): number => {
  switch (error.constructor.name) {
    case 'UrlValidationError':
      return 400;
    case 'UrlConflictError':
      return 409;
    case 'UrlNotFoundError':
      return 404;
    case 'RangeError':
      return 400;
    case 'TypeError':
      return 400;
    case 'SyntaxError':
      return 400;
    default:
      return 500;
  }
};

/**
 * Global error handling middleware
 * Catches all errors and returns consistent JSON error format
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error for debugging
  console.error(`[${new Date().toISOString()}] Error:`, {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // Handle express-rate-limit errors (429)
  if ('statusCode' in err && err.statusCode === 429) {
    const response: ErrorResponse = {
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later.'
      }
    };
    res.status(429).json(response);
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    const response: ErrorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON format'
      }
    };
    res.status(400).json(response);
    return;
  }

  // Handle known application errors
  const statusCode = getStatusCode(err);
  const response = formatError(err, statusCode);
  res.status(statusCode).json(response);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  const response: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  };
  res.status(404).json(response);
};
