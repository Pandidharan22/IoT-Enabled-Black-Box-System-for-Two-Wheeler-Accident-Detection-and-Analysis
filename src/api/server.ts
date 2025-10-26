import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger';
import config from '../config';
import { errorHandler } from '../middleware/error';
import { authMiddleware } from '../middleware/auth';
import apiRoutes from './routes';

const logger = createLogger('server');

export const createServer = () => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true
  }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.'
  }));

  // Request parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  // Health check endpoint (no auth required)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use(`/api/${config.API_VERSION}`, authMiddleware, apiRoutes);

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`
    });
  });

  return app;
};

export const startServer = () => {
  const app = createServer();
  
  const server = app.listen(config.PORT, () => {
    logger.info(`Server listening on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down server...');
    server.close(() => {
      logger.info('Server shut down successfully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
};