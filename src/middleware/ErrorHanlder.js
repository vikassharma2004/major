// utils/error-utils.js (ESM)
import logger from "../config/logger.js";

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.statusCode = 400;
    error.message = messages.join(", ");
    error.type = 'ValidationError';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.statusCode = 400;
    error.message = `Duplicate value for "${field}": ${err.keyValue[field]}`;
    error.type = 'DuplicateKeyError';
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error.statusCode = 400;
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.type = 'CastError';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid token';
    error.type = 'JWTError';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Token expired';
    error.type = 'JWTError';
  }

  // Log error with context
  const errorContext = {
    message: error.message,
    statusCode: error.statusCode,
    type: error.type || 'UnknownError',
    stack: err.stack,
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  if (error.statusCode >= 500) {
    logger.error('Server Error', errorContext);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', errorContext);
  } else {
    logger.info('Request Error', errorContext);
  }

  // Security-related errors
  if (error.statusCode === 401 || error.statusCode === 403) {
    logger.security(`Security violation: ${error.message}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.originalUrl,
      method: req.method
    });
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    message: error.message,
    status: error.statusCode,
    timestamp: error.timestamp
  };

  // Add additional details in development or for operational errors
  if (isDevelopment || error.isOperational) {
    if (error.details) {
      response.details = error.details;
    }
    if (isDevelopment && err.stack) {
      response.stack = err.stack;
    }
  }

  // Add request ID for tracking
  if (req.id) {
    response.requestId = req.id;
  }

  res.status(error.statusCode).json(response);
}
