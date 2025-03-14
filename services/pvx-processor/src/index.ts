import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { PVXProcessor } from './services/processor';
import { logger, requestLogger, errorLogger } from './utils/logger';
import { ProcessingOptions } from './types';
import multer from 'multer';
import path from 'path';

// Define request types with file upload
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

interface FilesRequest extends Request {
  files?: Express.Multer.File[];
}

const app = express();
const router = Router();
const upload = multer({ dest: 'uploads/' });

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// API routes
app.use('/api/v1', router);

// Process single PVX file
router.post('/process', upload.single('file'), async (req: FileRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const options: ProcessingOptions = req.body.options || {};
    const processor = new PVXProcessor(options);
    const result = await processor.processFile(req.file.path);

    res.json(result);
  } catch (error) {
    logger.error('Error processing PVX file:', error);
    res.status(500).json({ error: 'Failed to process PVX file' });
  }
});

// Process multiple PVX files
router.post('/process-batch', upload.array('files'), async (req: FilesRequest, res: Response) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const options: ProcessingOptions = req.body.options || {};
    const processor = new PVXProcessor(options);
    const filePaths = files.map(file => file.path);
    const results = await processor.processFiles(filePaths);

    res.json(results);
  } catch (error) {
    logger.error('Error processing PVX files:', error);
    res.status(500).json({ error: 'Failed to process PVX files' });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use(errorLogger);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3003;
app.listen(port, () => {
  logger.info(`PVX Processor Service running on port ${port}`);
});
