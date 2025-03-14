import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authController } from '../controllers/authController.js';
import { authValidation } from '../validations/authValidation.js';

export const configureRoutes = (app) => {
  const router = Router();

  // Auth routes
  router.post('/login', 
    validate(authValidation.login),
    authController.login
  );

  router.post('/register',
    validate(authValidation.register),
    authController.register
  );

  router.post('/refresh-token',
    validate(authValidation.refreshToken),
    authController.refreshToken
  );

  router.post('/logout',
    authController.validateToken,
    authController.logout
  );

  // User management routes
  router.get('/users',
    authController.validateToken,
    authController.checkRole(['admin']),
    authController.listUsers
  );

  router.get('/users/:id',
    authController.validateToken,
    authController.checkRole(['admin']),
    validate(authValidation.getUserById),
    authController.getUserById
  );

  router.put('/users/:id',
    authController.validateToken,
    authController.checkRole(['admin']),
    validate(authValidation.updateUser),
    authController.updateUser
  );

  router.delete('/users/:id',
    authController.validateToken,
    authController.checkRole(['admin']),
    validate(authValidation.deleteUser),
    authController.deleteUser
  );

  // Division-based access routes
  router.get('/divisions/:divisionId/users',
    authController.validateToken,
    authController.checkDivisionAccess,
    authController.listUsersByDivision
  );

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', router);
};
