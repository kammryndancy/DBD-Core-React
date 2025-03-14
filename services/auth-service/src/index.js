import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { configureRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { dbClient } from './db/index.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging middleware
app.use(requestLogger);

// Configure routes
configureRoutes(app);

// Error handling
app.use(errorHandler);

const PORT = config.port || 3001;

// Initialize database connection
dbClient.connect()
  .then(() => {
    logger.info('Connected to PostgreSQL database');
    app.listen(PORT, () => {
      logger.info(`Auth Service listening on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });
