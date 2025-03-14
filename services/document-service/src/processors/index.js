import { logger } from '../utils/logger.js';
import { APInvoiceProcessor } from './ap/invoiceProcessor.js';
import { ARInvoiceProcessor } from './ar/invoiceProcessor.js';
import { DocumentValidator } from './validation/documentValidator.js';
import { FileConverter } from './conversion/fileConverter.js';

// Global processor instances
let processors = {
  ap: null,
  ar: null,
  validator: null,
  converter: null
};

// Initialize all document processors
export const initializeProcessors = async () => {
  try {
    // Initialize processors (replacing PVX components)
    processors.ap = new APInvoiceProcessor();
    processors.ar = new ARInvoiceProcessor();
    processors.validator = new DocumentValidator();
    processors.converter = new FileConverter();

    await Promise.all([
      processors.ap.initialize(),
      processors.ar.initialize(),
      processors.validator.initialize(),
      processors.converter.initialize()
    ]);

    logger.info('Document processors initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize document processors:', error);
    throw error;
  }
};

// Get processor instance
export const getProcessor = (type) => {
  if (!processors[type]) {
    throw new Error(`Processor type '${type}' not found`);
  }
  return processors[type];
};
