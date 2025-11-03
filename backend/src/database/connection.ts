import { Pool } from 'pg';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

// Environment variables are validated in config/index.ts
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    // Maximum number of clients the pool should contain
    max: 20,
    // Maximum time (ms) that a client can be idle before being closed
    idleTimeoutMillis: 30000,
    // Maximum time (ms) to wait for a client from the pool
    connectionTimeoutMillis: 2000,
    // Disable SSL for local development
    ssl: false,
    keepAlive: true
});

// Test database connection
pool.connect()
    .then(client => {
        logger.info('Successfully connected to PostgreSQL database');
        client.release();
    })
    .catch(err => {
        logger.error('Error connecting to PostgreSQL database:', err);
        process.exit(1);
    });

// Error handling for the pool
pool.on('error', (err) => {
    logger.error('Unexpected error on idle client:', err);
    process.exit(1);
});

// Handle cleanup on application shutdown
process.on('SIGINT', () => {
    logger.info('Closing PostgreSQL pool...');
    pool.end()
        .then(() => {
            logger.info('PostgreSQL pool has been closed');
            process.exit(0);
        })
        .catch(err => {
            logger.error('Error closing PostgreSQL pool:', err);
            process.exit(1);
        });
});

export default pool;