import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import proxy from 'express-http-proxy';
import rateLimit from 'express-rate-limit';
import { configureRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging middleware
app.use(requestLogger);

// Authentication middleware
app.use(authMiddleware);

// Configure routes and service proxies
configureRoutes(app);

// Error handling
app.use(errorHandler);

const PORT = config.port || 3000;

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});
