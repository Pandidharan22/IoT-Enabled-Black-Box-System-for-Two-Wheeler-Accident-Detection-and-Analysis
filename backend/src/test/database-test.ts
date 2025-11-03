import pool from '../database/connection';
import { createLogger } from '../utils/logger';

const logger = createLogger('database-test');

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