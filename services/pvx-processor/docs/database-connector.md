# PostgreSQL Database Connector Documentation

## Overview

The PostgreSQL database connector provides a robust interface for connecting to and interacting with PostgreSQL databases in the PVX Migration system. This connector implements modern PostgreSQL features including UUIDs, audit fields, row-level security, and full-text search capabilities.

## Configuration

### Environment Variables

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=pvx_migration
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_SSL=true
POSTGRES_MAX_POOL_SIZE=20
POSTGRES_IDLE_TIMEOUT=10000
```

### Connection Pool Configuration

```typescript
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.POSTGRES_SSL === 'true',
  max: parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '20'),
  idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '10000'),
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);
```

## Data Type Mappings

The connector implements the following data type mappings from PVX to PostgreSQL:

```typescript
const dataTypeMappings = {
  'CHAR': 'VARCHAR',
  'NUMBER': 'DECIMAL(14,3)',
  'DATE': 'TIMESTAMP WITH TIME ZONE',
  'BOOLEAN': 'BOOLEAN',
  'INTEGER': 'INTEGER',
  'TEXT': 'TEXT'
};
```

## Modern Features Implementation

### UUID Primary Keys

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Example table creation with UUID
CREATE TABLE vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_code VARCHAR(20) UNIQUE NOT NULL,
  -- other fields...
);
```

### Audit Fields

```sql
-- Add audit fields to tables
ALTER TABLE vendors 
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN created_by UUID REFERENCES users(id),
ADD COLUMN updated_by UUID REFERENCES users(id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION update_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.updated_by = current_user_id(); -- Custom function to get current user
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER vendors_audit
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_fields();
```

### Row-Level Security

```sql
-- Enable RLS on table
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY vendors_division_access ON vendors
    FOR ALL
    TO authenticated_users
    USING (division_id IN (SELECT division_id FROM user_divisions WHERE user_id = current_user_id()));
```

### Full-Text Search

```sql
-- Add full-text search columns
ALTER TABLE vendors 
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(vendor_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(vendor_code, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
) STORED;

-- Create search index
CREATE INDEX vendors_search_idx ON vendors USING GIN (search_vector);
```

## Usage Examples

### Basic Connection

```typescript
import { pool } from './db/connector';

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Connected to PostgreSQL:', result.rows[0]);
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}
```

### Implementing AP Module Tables

```typescript
import { pool } from './db/connector';

async function createAPTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // AP0_Div - Divisions
    await client.query(`
      CREATE TABLE divisions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        division_code VARCHAR(10) UNIQUE NOT NULL,
        division_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      );
    `);

    // AP4_Vend - Vendors
    await client.query(`
      CREATE TABLE vendors (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        vendor_code VARCHAR(20) UNIQUE NOT NULL,
        vendor_name VARCHAR(100) NOT NULL,
        division_id UUID REFERENCES divisions(id),
        category_id UUID REFERENCES vendor_categories(id),
        status_id UUID REFERENCES vendor_status(id),
        payment_terms_id UUID REFERENCES payment_terms(id),
        search_vector tsvector,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      );
    `);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

### Implementing AR Module Tables

```typescript
import { pool } from './db/connector';

async function createARTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // AR1_Cust - Customers
    await client.query(`
      CREATE TABLE customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_code VARCHAR(20) UNIQUE NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        division_id UUID REFERENCES divisions(id),
        payment_terms_id UUID REFERENCES ar_terms(id),
        search_vector tsvector,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      );
    `);

    // AR6_OpenInvoice - Open Invoices
    await client.query(`
      CREATE TABLE open_invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        invoice_number VARCHAR(20) UNIQUE NOT NULL,
        customer_id UUID REFERENCES customers(id),
        amount DECIMAL(14,3) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      );
    `);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

### Error Handling

```typescript
import { pool } from './db/connector';
import { logger } from '../utils/logger';

async function executeQuery(query: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (err) {
    logger.error('Database query error:', {
      query,
      params,
      error: err.message,
      stack: err.stack
    });
    throw err;
  } finally {
    client.release();
  }
}
```

## Best Practices

1. **Connection Management**
   - Always use connection pooling
   - Release connections after use
   - Set appropriate pool size based on workload

2. **Transaction Handling**
   - Use transactions for multi-step operations
   - Implement proper rollback mechanisms
   - Handle deadlocks gracefully

3. **Security**
   - Use parameterized queries to prevent SQL injection
   - Implement row-level security policies
   - Encrypt sensitive data

4. **Performance**
   - Create appropriate indexes
   - Use EXPLAIN ANALYZE for query optimization
   - Implement connection pooling
   - Use prepared statements for repeated queries

5. **Monitoring**
   - Log slow queries
   - Monitor connection pool usage
   - Track query performance metrics

## Troubleshooting

Common issues and their solutions:

1. **Connection Timeouts**
   ```typescript
   // Increase connection timeout
   const poolConfig = {
     ...defaultConfig,
     connectionTimeoutMillis: 5000
   };
   ```

2. **Pool Exhaustion**
   ```typescript
   // Monitor pool statistics
   const poolStats = await pool.totalCount;
   logger.info('Pool statistics:', {
     total: poolStats,
     idle: pool.idleCount,
     waiting: pool.waitingCount
   });
   ```

3. **Query Performance**
   ```sql
   -- Analyze query performance
   EXPLAIN ANALYZE
   SELECT * FROM vendors
   WHERE search_vector @@ to_tsquery('english', 'search_term');
   ```

## Migration Utilities

```typescript
import { pool } from './db/connector';

async function migrateTable(tableName: string, data: any[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const record of data) {
      await client.query(
        `INSERT INTO ${tableName} (${Object.keys(record).join(', ')})
         VALUES (${Object.keys(record).map((_, i) => `$${i + 1}`).join(', ')})`,
        Object.values(record)
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```
