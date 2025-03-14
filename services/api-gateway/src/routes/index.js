import proxy from 'express-http-proxy';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const configureRoutes = (app) => {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth Service Routes
  app.use('/api/auth', proxy(config.services.auth.url, {
    proxyReqPathResolver: (req) => `/api/auth${req.url}`,
    proxyTimeout: config.services.auth.timeout,
    proxyErrorHandler: (err, res, next) => handleProxyError(err, 'Auth Service', res)
  }));

  // AP Module Routes
  const apRoutes = [
    '/api/divisions',     // AP0_Div
    '/api/payment-terms', // AP2_Term
    '/api/vendors',      // AP4_Vend
    '/api/vendor-categories', // AP3_VendCatg
    '/api/vendor-status',    // AP5_VendStatus
    '/api/vendor-messages',  // AP8_VendMsg
    '/api/vendor-statistics',// AP9_VendStats
    '/api/ap-invoices'      // APA_InvoiceEntManChk
  ];

  apRoutes.forEach(route => {
    app.use(route, proxy(config.services.document.url, {
      proxyReqPathResolver: (req) => req.url,
      proxyTimeout: config.services.document.timeout,
      proxyErrorHandler: (err, res, next) => handleProxyError(err, 'Document Service', res)
    }));
  });

  // AR Module Routes
  const arRoutes = [
    '/api/customers',        // AR1_Cust
    '/api/ar-terms',        // AR2_Terms
    '/api/sales-tax',       // AR5_SlsTax
    '/api/open-invoices',   // AR6_OpenInvoice
    '/api/salesperson-stats',// ARA_SlspersonStats
    '/api/ar-invoices'      // ARB_InvoiceEntHdr
  ];

  arRoutes.forEach(route => {
    app.use(route, proxy(config.services.document.url, {
      proxyReqPathResolver: (req) => req.url,
      proxyTimeout: config.services.document.timeout,
      proxyErrorHandler: (err, res, next) => handleProxyError(err, 'Document Service', res)
    }));
  });

  // Validation Service Routes
  app.use('/api/validate', proxy(config.services.validation.url, {
    proxyReqPathResolver: (req) => `/api/validate${req.url}`,
    proxyTimeout: config.services.validation.timeout,
    proxyErrorHandler: (err, res, next) => handleProxyError(err, 'Validation Service', res)
  }));
};

const handleProxyError = (err, serviceName, res) => {
  logger.error(`${serviceName} proxy error:`, err);
  res.status(502).json({
    error: 'Service Unavailable',
    message: `${serviceName} is currently unavailable`,
    details: err.message
  });
};
