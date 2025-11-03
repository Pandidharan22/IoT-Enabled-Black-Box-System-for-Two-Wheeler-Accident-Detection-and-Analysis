import { config as dotenvConfig } from 'dotenv';
import { Pool } from 'pg';
import { createLogger } from '../utils/logger';

// Load environment variables
dotenvConfig();

const logger = createLogger('database-test');

// Log the environment variables we're using (mask the password)
logger.info('Database configuration:', {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD ? '***' : 'not set'
});

// Create a test pool
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: false,
    keepAlive: true
});

async function testDatabaseConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT current_timestamp');
        logger.info('Database test query result:', result.rows[0]);
        client.release();
        return true;
    } catch (error) {
        logger.error('Database connection test failed:', error);
        return false;
    }
}

// Run the test
testDatabaseConnection()
    .then((success) => {
        if (success) {
            logger.info('Database connection test passed ✅');
            process.exit(0);
        } else {
            logger.error('Database connection test failed ❌');
            process.exit(1);
        }
    })
    .catch((error) => {
        logger.error('Unexpected error during database test:', error);
        process.exit(1);
    });