import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT || '5000')
    },
    document: {
      url: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3002',
      timeout: parseInt(process.env.DOCUMENT_SERVICE_TIMEOUT || '5000')
    },
    validation: {
      url: process.env.VALIDATION_SERVICE_URL || 'http://localhost:3003',
      timeout: parseInt(process.env.VALIDATION_SERVICE_TIMEOUT || '5000')
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
