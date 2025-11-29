import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import { logger } from './config/logger.config';
import authRoutes from './api/routes/auth.routes';
import adminRoutes from './api/routes/admin.routes';
import profileRoutes from './api/routes/profile.routes';
import curriculumRoutes from './api/routes/curriculum.routes';
import aiProviderRoutes from './api/routes/aiProvider.routes';
import { errorHandler, notFoundHandler } from './api/middleware/error.middleware';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // In development, allow all localhost origins
        if (env.NODE_ENV === 'development') {
          if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
          } else {
            callback(null, true); // Allow all in development
          }
        } else {
          // In production, check against allowed origins
          const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      },
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Request logging middleware
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  const apiVersion = env.API_VERSION;
  app.use(`/api/${apiVersion}/auth`, authRoutes);
  app.use(`/api/${apiVersion}/admin`, adminRoutes);
  app.use(`/api/${apiVersion}/profile`, profileRoutes);
  app.use(`/api/${apiVersion}/curricula`, curriculumRoutes);
  app.use(`/api/${apiVersion}/ai`, aiProviderRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
