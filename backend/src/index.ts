import { createApp } from './app';
import { env } from './config/env.config';
import { logger } from './config/logger.config';
import { database } from './config/database.config';
import { redis } from './config/redis.config';
import { MigrationRunner } from './database/migrate';

async function bootstrap() {
  try {
    logger.info('Starting application...');

    // Test database connection
    const dbConnected = await database.testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Run migrations
    logger.info('Running database migrations...');
    const migrationRunner = new MigrationRunner();
    await migrationRunner.runMigrations();

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await redis.connect();

    // Create Express app
    const app = createApp();

    // Start server
    const port = env.PORT;
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API Version: ${env.API_VERSION}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      try {
        await database.close();
        await redis.disconnect();
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
