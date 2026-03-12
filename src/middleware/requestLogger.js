import logger from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - start;
    logger.request(req, res, responseTime);
    originalEnd.apply(this, args);
  };

  next();
};

export const securityLogger = (event, req, additionalData = {}) => {
  logger.security(`Security event: ${event}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    url: req.originalUrl,
    method: req.method,
    ...additionalData
  });
};

export const auditLogger = (action, req, resource, additionalData = {}) => {
  logger.audit(action, req.user?.id, resource, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    ...additionalData
  });
};