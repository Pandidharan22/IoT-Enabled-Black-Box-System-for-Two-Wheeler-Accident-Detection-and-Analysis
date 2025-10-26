export interface AppConfig {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_VERSION: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // MQTT
  MQTT_BROKER_URL: string;
  MQTT_USERNAME: string;
  MQTT_PASSWORD: string;
  MQTT_CLIENT_ID: string;
  MQTT_TLS_CA_FILE?: string;
  MQTT_TLS_CERT_FILE?: string;
  MQTT_TLS_KEY_FILE?: string;

  // PostgreSQL
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;

  // InfluxDB
  INFLUXDB_URL: string;
  INFLUXDB_TOKEN: string;
  INFLUXDB_ORG: string;
  INFLUXDB_BUCKET: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';

  // Security
  CORS_ORIGIN: string;
  TLS_ENABLED: boolean;
}