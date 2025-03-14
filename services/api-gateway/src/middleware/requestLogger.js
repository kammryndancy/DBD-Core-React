import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request details
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.get('user-agent'),
      'x-request-id': req.get('x-request-id')
    }
  });

  // Log response details
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};
