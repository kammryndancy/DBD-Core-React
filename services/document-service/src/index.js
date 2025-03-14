import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { configureRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { dbClient } from './db/index.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { initializeProcessors } from './processors/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// File size limit for document uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use(requestLogger);

// Initialize document processors (replacing PVX processors)
await initializeProcessors();

// Configure routes
configureRoutes(app);

// Error handling
app.use(errorHandler);

const PORT = config.port || 3002;

// Initialize database connection
dbClient.connect()
  .then(() => {
    logger.info('Connected to PostgreSQL database');
    app.listen(PORT, () => {
      logger.info(`Document Service listening on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });
