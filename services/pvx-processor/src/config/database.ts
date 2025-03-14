import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

// Data type mappings based on migration strategy
export const dataTypeMappings = {
  CHAR: 'VARCHAR',
  NUMBER: 'DECIMAL(14,3)',
  DATE: 'TIMESTAMP WITH TIME ZONE',
  BOOLEAN: 'BOOLEAN',
  INTEGER: 'INTEGER',
  TEXT: 'TEXT'
};

// Database configuration with modern features
export const dbConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'pvx_migration',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.POSTGRES_SSL === 'true',
  max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '20'),
  idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '10000'),
  connectionTimeoutMillis: 2000,
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Initialize database with extensions and features
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Enable required extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');

    // Create audit trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_audit_fields()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          NEW.updated_by = current_user_id();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create function to get current user ID
    await client.query(`
      CREATE OR REPLACE FUNCTION current_user_id()
      RETURNS UUID AS $$
      BEGIN
          RETURN current_setting('app.user_id')::UUID;
      EXCEPTION
          WHEN OTHERS THEN
              RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query('COMMIT');
    logger.info('Database initialized with required extensions and functions');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Utility function to create a table with modern features
export async function createModernTable(
  tableName: string,
  columns: string[],
  options: {
    enableRLS?: boolean;
    enableSearch?: boolean;
    searchFields?: string[];
  } = {}
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create table with UUID and audit fields
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        ${columns.join(',\n        ')},
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      );
    `;
    await client.query(createTableSQL);

    // Add audit trigger
    await client.query(`
      CREATE TRIGGER ${tableName}_audit
          BEFORE UPDATE ON ${tableName}
          FOR EACH ROW
          EXECUTE FUNCTION update_audit_fields();
    `);

    // Enable row-level security if requested
    if (options.enableRLS) {
      await client.query(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`);
      await client.query(`
        CREATE POLICY ${tableName}_division_access ON ${tableName}
            FOR ALL
            TO authenticated_users
            USING (division_id IN (
                SELECT division_id 
                FROM user_divisions 
                WHERE user_id = current_user_id()
            ));
      `);
    }

    // Add full-text search if requested
    if (options.enableSearch && options.searchFields) {
      const searchVector = options.searchFields
        .map((field, index) => `setweight(to_tsvector('english', coalesce(${field}, '')), '${String.fromCharCode(65 + index)}')`)
        .join(' || ');

      await client.query(`
        ALTER TABLE ${tableName} 
        ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (${searchVector}) STORED;

        CREATE INDEX ${tableName}_search_idx ON ${tableName} USING GIN (search_vector);
      `);
    }

    await client.query('COMMIT');
    logger.info(`Table ${tableName} created with modern features`);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error creating table ${tableName}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

// Example usage for AP4_Vend table
export async function createVendorsTable() {
  await createModernTable(
    'vendors',
    [
      'vendor_code VARCHAR(20) UNIQUE NOT NULL',
      'vendor_name VARCHAR(100) NOT NULL',
      'division_id UUID REFERENCES divisions(id)',
      'category_id UUID REFERENCES vendor_categories(id)',
      'status_id UUID REFERENCES vendor_status(id)',
      'payment_terms_id UUID REFERENCES payment_terms(id)'
    ],
    {
      enableRLS: true,
      enableSearch: true,
      searchFields: ['vendor_code', 'vendor_name']
    }
  );
}

// Pool error handling
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
export async function closePool() {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (err) {
    logger.error('Error closing database pool:', err);
    throw err;
  }
}

// Export connection helper
export async function getConnection() {
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    logger.error('Error getting database connection:', err);
    throw err;
  }
}
