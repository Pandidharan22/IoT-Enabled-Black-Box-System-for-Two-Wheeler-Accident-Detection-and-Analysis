import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenvConfig();

// Configuration schema using Zod for validation
const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // MQTT
  MQTT_BROKER_URL: z.string(),
  MQTT_PORT: z.string().transform(Number),
  MQTT_USERNAME: z.string(),
  MQTT_PASSWORD: z.string(),
  MQTT_CLIENT_ID: z.string(),
  MQTT_USE_TLS: z.string().transform((val) => val === 'true').default('false'),

  // PostgreSQL
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.string().transform(Number),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),

  // InfluxDB
  INFLUXDB_URL: z.string().url(),
  INFLUXDB_TOKEN: z.string(),
  INFLUXDB_ORG: z.string(),
  INFLUXDB_BUCKET: z.string(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Security
  CORS_ORIGIN: z.string().url(),
  TLS_ENABLED: z.string().transform((val) => val === 'true').default('true'),
});

// Parse and validate environment variables
const config = configSchema.parse(process.env);

export default config;