import winston from 'winston';

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Define custom colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Create custom format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create the logger
export const logger = winston.createLogger({
  levels,
  format,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info'
    }),
    // File transport for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info'
    })
  ]
});

// Add request context logger
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();

  // Log request
  logger.info(`[${requestId}] ${req.method} ${req.url} started`);

  // Log request body if present
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug(`[${requestId}] Request body: ${JSON.stringify(req.body)}`);
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk: any, encoding: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Log response
    if (statusCode >= 400) {
      logger.error(
        `[${requestId}] ${req.method} ${req.url} completed with status ${statusCode} in ${duration}ms`
      );
    } else {
      logger.info(
        `[${requestId}] ${req.method} ${req.url} completed with status ${statusCode} in ${duration}ms`
      );
    }

    res.end = originalEnd;
    res.end(chunk, encoding);
  };

  next();
};

// Add error logger
export const errorLogger = (err: Error, req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || 'unknown';

  logger.error(`[${requestId}] Error: ${err.message}`);
  logger.error(`[${requestId}] Stack: ${err.stack}`);

  next(err);
};

// Add validation logger
export const validationLogger = (
  fileType: string,
  errors: any[],
  warnings: string[]
) => {
  if (errors.length > 0) {
    logger.error(`Validation errors for ${fileType}:`);
    errors.forEach((error) => {
      logger.error(
        `- ${error.code}: ${error.message}${
          error.line ? ` (line ${error.line})` : ''
        }${error.field ? ` in field ${error.field}` : ''}`
      );
    });
  }

  if (warnings.length > 0) {
    logger.warn(`Validation warnings for ${fileType}:`);
    warnings.forEach((warning) => {
      logger.warn(`- ${warning}`);
    });
  }
};

// Add conversion logger
export const conversionLogger = (
  fileType: string,
  tableName: string,
  options: any
) => {
  logger.info(
    `Converting ${fileType} to PostgreSQL table ${tableName} with options:`,
    options
  );
};

// Add performance logger
export const performanceLogger = {
  start: (operation: string) => {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        logger.info(`${operation} completed in ${duration}ms`);
        return duration;
      }
    };
  }
};
