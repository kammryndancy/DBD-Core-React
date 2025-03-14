import { Router } from 'express';
import multer from 'multer';
import { validate } from '../middleware/validate.js';
import { documentValidation } from '../validations/documentValidation.js';
import { documentController } from '../controllers/documentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const configureRoutes = (app) => {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // AP Document Routes
  router.post('/ap/invoices',
    upload.single('file'),
    validate(documentValidation.uploadInvoice),
    documentController.uploadAPInvoice
  );

  router.post('/ap/invoices/batch',
    upload.array('files', 10),
    validate(documentValidation.uploadBatch),
    documentController.uploadAPBatch
  );

  router.get('/ap/invoices/:id',
    validate(documentValidation.getDocument),
    documentController.getAPInvoice
  );

  router.get('/ap/vendors/:vendorId/invoices',
    validate(documentValidation.listVendorInvoices),
    documentController.listVendorInvoices
  );

  // AR Document Routes
  router.post('/ar/invoices',
    upload.single('file'),
    validate(documentValidation.uploadInvoice),
    documentController.uploadARInvoice
  );

  router.post('/ar/invoices/batch',
    upload.array('files', 10),
    validate(documentValidation.uploadBatch),
    documentController.uploadARBatch
  );

  router.get('/ar/invoices/:id',
    validate(documentValidation.getDocument),
    documentController.getARInvoice
  );

  router.get('/ar/customers/:customerId/invoices',
    validate(documentValidation.listCustomerInvoices),
    documentController.listCustomerInvoices
  );

  // Document Processing Status Routes
  router.get('/status/:processId',
    validate(documentValidation.getProcessStatus),
    documentController.getProcessStatus
  );

  // Document Search Routes
  router.get('/search',
    validate(documentValidation.searchDocuments),
    documentController.searchDocuments
  );

  // Document Export Routes
  router.post('/export',
    validate(documentValidation.exportDocuments),
    documentController.exportDocuments
  );

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/documents', router);
};
