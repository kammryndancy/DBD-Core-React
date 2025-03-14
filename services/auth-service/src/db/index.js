import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

class DatabaseClient {
  constructor() {
    this.pool = new Pool({
      ...config.db,
      application_name: 'auth-service'
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  async connect() {
    try {
      const client = await this.pool.connect();
      client.release();
      await this.initializeTables();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Error connecting to database:', error);
      throw error;
    }
  }

  async initializeTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create users table with modern PostgreSQL features
      await client.query(`
        CREATE TABLE IF NOT EXISTS auth.users (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          username varchar(50) NOT NULL UNIQUE,
          email varchar(255) NOT NULL UNIQUE,
          password_hash varchar(255) NOT NULL,
          first_name varchar(50),
          last_name varchar(50),
          division_id uuid REFERENCES accounts_payable.divisions(id),
          role varchar(20) NOT NULL,
          status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
          failed_login_attempts integer DEFAULT 0,
          last_login_attempt timestamp with time zone,
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          created_by varchar(100) NOT NULL,
          updated_by varchar(100) NOT NULL
        );

        -- Add full text search capabilities
        CREATE INDEX IF NOT EXISTS idx_users_search ON auth.users USING gin(
          to_tsvector('english',
            coalesce(username,'') || ' ' ||
            coalesce(email,'') || ' ' ||
            coalesce(first_name,'') || ' ' ||
            coalesce(last_name,'')
          )
        );

        -- Add row-level security
        ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

        -- Create refresh tokens table
        CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
          token varchar(255) NOT NULL UNIQUE,
          expires_at timestamp with time zone NOT NULL,
          created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
          created_by varchar(100) NOT NULL
        );

        -- Create audit trigger for users table
        CREATE TRIGGER users_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger();

        -- Create updated_at trigger for users table
        CREATE OR REPLACE FUNCTION auth.update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_users_timestamp
        BEFORE UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION auth.update_updated_at();
      `);

      await client.query('COMMIT');
      logger.info('Database tables initialized successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error initializing database tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Error executing query:', { text, error });
      throw error;
    }
  }

  async getClient() {
    const client = await this.pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout of 5 seconds on idle clients
    const timeout = setTimeout(() => {
      logger.error('A client has been checked out for too long.');
      logger.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);

    // Monkey patch the query method to keep track of the last query
    client.query = (...args) => {
      client.lastQuery = args;
      return query(...args);
    };

    client.release = () => {
      clearTimeout(timeout);
      client.query = query;
      client.release = release;
      return release();
    };

    return client;
  }
}

export const dbClient = new DatabaseClient();
