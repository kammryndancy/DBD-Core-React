import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const authMiddleware = async (req, res, next) => {
  // Skip auth for public routes
  if (isPublicRoute(req.path)) {
    return next();
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const isPublicRoute = (path) => {
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/health'
  ];
  return publicRoutes.includes(path);
};

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};
