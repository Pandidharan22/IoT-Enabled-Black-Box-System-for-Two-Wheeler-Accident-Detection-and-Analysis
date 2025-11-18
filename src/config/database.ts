import { Pool, PoolClient, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
import config from './index';
import { createLogger } from '../utils/logger';

const logger = createLogger('Database');

/**
 * PostgreSQL connection pool instance
 * Manages database connections with automatic reconnection
 */
let pool: Pool | null = null;

/**
 * Database configuration options
 */
const dbConfig = {
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  database: config.POSTGRES_DB,
  user: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection not available
};

/**
 * Initialize the database connection pool
 * @returns {Promise<Pool>} The initialized connection pool
 */
export async function initializeDatabase(): Promise<Pool> {
  try {
    logger.info('Initializing database connection pool...');
    
    pool = new Pool(dbConfig);

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`Database connected successfully at ${result.rows[0].now}`);
    client.release();

    // Run migrations
    await runMigrations();

    // Set up error handlers
    pool.on('error', (err) => {
      logger.error('Unexpected database pool error:', err);
    });

    pool.on('connect', () => {
      logger.debug('New client connected to database');
    });

    pool.on('remove', () => {
      logger.debug('Client removed from database pool');
    });

    logger.info('Database initialization complete');
    return pool;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Run database migrations
 * Executes all SQL migration files in order
 */
async function runMigrations(): Promise<void> {
  try {
    logger.info('Running database migrations...');
    
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      logger.warn(`Migrations directory not found: ${migrationsDir}`);
      return;
    }

    // Get all .sql files and sort them
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      logger.info('No migration files found');
      return;
    }

    // Execute each migration file
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      logger.info(`Executing migration: ${file}`);
      await pool!.query(sql);
      logger.info(`Migration completed: ${file}`);
    }

    logger.info('All migrations executed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Get the database connection pool
 * @returns {Pool} The connection pool instance
 * @throws {Error} If pool is not initialized
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query with automatic connection handling
 * @param {string} text - SQL query text
 * @param {any[]} params - Query parameters
 * @returns {Promise<QueryResult>} Query result
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', { 
      text: text.substring(0, 100), // Log first 100 chars
      duration, 
      rows: result.rowCount 
    });
    
    return result;
  } catch (error) {
    logger.error('Query error:', { 
      text: text.substring(0, 100), 
      error 
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transaction handling
 * @returns {Promise<PoolClient>} A pool client
 */
export async function getClient(): Promise<PoolClient> {
  return await getPool().connect();
}

/**
 * Execute a function within a database transaction
 * Automatically handles commit/rollback
 * 
 * @param {Function} callback - Async function to execute within transaction
 * @returns {Promise<T>} Result of the callback function
 * 
 * @example
 * await withTransaction(async (client) => {
 *   await client.query('INSERT INTO users ...');
 *   await client.query('INSERT INTO devices ...');
 * });
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    logger.debug('Transaction committed');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database connection pool
 * Should be called during graceful shutdown
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    logger.info('Closing database connection pool...');
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

/**
 * Check database health
 * @returns {Promise<boolean>} True if database is healthy
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

export default {
  initializeDatabase,
  getPool,
  query,
  getClient,
  withTransaction,
  closeDatabase,
  checkDatabaseHealth,
};
