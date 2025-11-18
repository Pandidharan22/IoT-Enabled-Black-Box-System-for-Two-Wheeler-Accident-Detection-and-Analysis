import { startServer } from './api/server';
import { mqttClient } from './mqtt/client';
import { createLogger } from './utils/logger';
import { initializeDatabase, closeDatabase } from './config/database';
import { registerMQTTHandlers, unregisterMQTTHandlers } from './services/mqtt-handler.service';

const logger = createLogger('app');

async function main() {
  try {
    logger.info('Starting IoT Black Box Backend...');

    // Initialize PostgreSQL database
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('✓ Database initialized successfully');

    // Connect to MQTT broker
    logger.info('Connecting to MQTT broker...');
    await mqttClient.connect();
    logger.info('✓ MQTT client connected successfully');

    // Register MQTT message handlers
    logger.info('Registering MQTT message handlers...');
    registerMQTTHandlers();
    logger.info('✓ MQTT handlers registered successfully');

    // Start the HTTP server
    logger.info('Starting HTTP server...');
    startServer();
    logger.info('✓ Application started successfully');
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Unregister MQTT handlers
    unregisterMQTTHandlers();

    // Disconnect MQTT client
    await mqttClient.disconnect();
    logger.info('✓ MQTT client disconnected');

    // Close database connections
    await closeDatabase();
    logger.info('✓ Database connections closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});