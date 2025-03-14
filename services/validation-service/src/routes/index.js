import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { validationController } from '../controllers/validationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const configureRoutes = (app) => {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // AP Validation Routes
  router.post('/ap/vendors/validate',
    validate(['vendorData']),
    validationController.validateAPVendor
  );

  router.post('/ap/invoices/validate',
    validate(['invoiceData']),
    validationController.validateAPInvoice
  );

  router.post('/ap/batch/validate',
    validate(['batchData']),
    validationController.validateAPBatch
  );

  // AR Validation Routes
  router.post('/ar/customers/validate',
    validate(['customerData']),
    validationController.validateARCustomer
  );

  router.post('/ar/invoices/validate',
    validate(['invoiceData']),
    validationController.validateARInvoice
  );

  router.post('/ar/batch/validate',
    validate(['batchData']),
    validationController.validateARBatch
  );

  // Common Validation Routes
  router.post('/divisions/validate',
    validate(['divisionData']),
    validationController.validateDivision
  );

  router.post('/payment-terms/validate',
    validate(['paymentTermsData']),
    validationController.validatePaymentTerms
  );

  // Data Type Validation Routes
  router.post('/types/validate', 
    validate(['data', 'type']),
    validationController.validateDataType
  );

  // Schema Management Routes
  router.get('/schemas/:module/:entity',
    validationController.getValidationSchema
  );

  router.put('/schemas/:module/:entity',
    validate(['schemaDefinition']),
    validationController.updateValidationSchema
  );

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/validate', router);
};
