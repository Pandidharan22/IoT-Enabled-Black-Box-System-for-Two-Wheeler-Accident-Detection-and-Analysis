import { startServer } from './api/server';
import { mqttClient } from './mqtt/client';
import { createLogger } from './utils/logger';

const logger = createLogger('app');

async function main() {
  try {
    // Connect to MQTT broker
    await mqttClient.connect();

    // Start the HTTP server
    startServer();
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});