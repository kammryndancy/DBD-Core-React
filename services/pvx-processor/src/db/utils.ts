import { Pool, QueryResult } from 'pg';
import { logger } from '../utils/logger';
import { dataTypeMappings } from '../config/database';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface DataTypeValidation {
  field: string;
  value: any;
  type: string;
  required?: boolean;
  maxLength?: number;
  pattern?: RegExp;
}

/**
 * Validates data types according to PVX to PostgreSQL mapping rules
 */
export function validateDataType(validation: DataTypeValidation): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Check required fields
  if (validation.required && (validation.value === null || validation.value === undefined)) {
    result.errors.push(`Field '${validation.field}' is required`);
    result.isValid = false;
    return result;
  }

  // Skip validation if value is null/undefined and not required
  if (validation.value === null || validation.value === undefined) {
    return result;
  }

  switch (validation.type) {
    case 'CHAR':
    case 'VARCHAR':
      if (typeof validation.value !== 'string') {
        result.errors.push(`Field '${validation.field}' must be a string`);
        result.isValid = false;
      } else if (validation.maxLength && validation.value.length > validation.maxLength) {
        result.errors.push(`Field '${validation.field}' exceeds maximum length of ${validation.maxLength}`);
        result.isValid = false;
      }
      break;

    case 'NUMBER':
    case 'DECIMAL':
      const num = Number(validation.value);
      if (isNaN(num)) {
        result.errors.push(`Field '${validation.field}' must be a number`);
        result.isValid = false;
      }
      break;

    case 'DATE':
      const date = new Date(validation.value);
      if (isNaN(date.getTime())) {
        result.errors.push(`Field '${validation.field}' must be a valid date`);
        result.isValid = false;
      }
      break;

    case 'BOOLEAN':
      if (typeof validation.value !== 'boolean') {
        result.errors.push(`Field '${validation.field}' must be a boolean`);
        result.isValid = false;
      }
      break;
  }

  // Check pattern if provided
  if (validation.pattern && typeof validation.value === 'string' && !validation.pattern.test(validation.value)) {
    result.errors.push(`Field '${validation.field}' does not match required pattern`);
    result.isValid = false;
  }

  return result;
}

/**
 * Converts PVX data types to PostgreSQL data types
 */
export function convertDataType(pvxType: string, length?: number): string {
  const pgType = dataTypeMappings[pvxType];
  if (!pgType) {
    throw new Error(`Unsupported PVX data type: ${pvxType}`);
  }
  return pgType;
}

/**
 * Executes a query with proper error handling and logging
 */
export async function executeQuery<T>(
  pool: Pool,
  query: string,
  params: any[] = [],
  options: { 
    retryCount?: number;
    timeout?: number;
  } = {}
): Promise<QueryResult<T>> {
  const retryCount = options.retryCount || 3;
  const timeout = options.timeout || 5000;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    const client = await pool.connect();
    try {
      const result = await Promise.race([
        client.query(query, params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ]) as QueryResult<T>;

      logger.debug('Query executed successfully', {
        query,
        params,
        rowCount: result.rowCount
      });

      return result;
    } catch (error) {
      lastError = error as Error;
      logger.error(`Query error (attempt ${attempt}/${retryCount}):`, {
        error,
        query,
        params
      });

      // Don't retry on certain errors
      if (
        error.code === '23505' || // unique_violation
        error.code === '23503' || // foreign_key_violation
        error.code === '42P01'    // undefined_table
      ) {
        throw error;
      }

      if (attempt === retryCount) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    } finally {
      client.release();
    }
  }

  throw lastError;
}

/**
 * Builds a WHERE clause for search queries
 */
export function buildSearchQuery(
  searchTerm: string,
  options: {
    fields: string[];
    caseSensitive?: boolean;
    exactMatch?: boolean;
  }
): { query: string; params: any[] } {
  const { fields, caseSensitive = false, exactMatch = false } = options;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (exactMatch) {
    fields.forEach(field => {
      conditions.push(`${field} ${caseSensitive ? '=' : 'ILIKE'} $${paramIndex}`);
      params.push(caseSensitive ? searchTerm : searchTerm);
      paramIndex++;
    });
  } else {
    fields.forEach(field => {
      conditions.push(`${field} ${caseSensitive ? 'LIKE' : 'ILIKE'} $${paramIndex}`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
    });
  }

  return {
    query: conditions.join(' OR '),
    params
  };
}

/**
 * Builds pagination parameters
 */
export function buildPagination(
  page: number = 1,
  pageSize: number = 10
): { limit: number; offset: number } {
  const limit = Math.max(1, Math.min(100, pageSize)); // Ensure pageSize is between 1 and 100
  const offset = Math.max(0, page - 1) * limit;
  return { limit, offset };
}

/**
 * Validates and sanitizes sort parameters
 */
export function buildSortClause(
  sortField: string,
  sortOrder: 'ASC' | 'DESC' = 'ASC',
  allowedFields: string[]
): string {
  if (!allowedFields.includes(sortField)) {
    throw new Error(`Invalid sort field: ${sortField}`);
  }
  return `${sortField} ${sortOrder}`;
}

/**
 * Builds a full-text search query using tsvector
 */
export function buildFullTextSearch(
  searchTerm: string,
  options: {
    language?: string;
    weights?: { [key: string]: string };
  } = {}
): { query: string; params: any[] } {
  const { language = 'english', weights = {} } = options;
  const searchQuery = searchTerm
    .split(' ')
    .filter(term => term.length > 0)
    .map(term => `${term}:*`)
    .join(' & ');

  return {
    query: `search_vector @@ to_tsquery($1)`,
    params: [searchQuery]
  };
}

/**
 * Validates a record against a schema
 */
export function validateRecord(
  record: any,
  schema: {
    [key: string]: {
      type: string;
      required?: boolean;
      maxLength?: number;
      pattern?: RegExp;
    }
  }
): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  for (const [field, rules] of Object.entries(schema)) {
    const validation = validateDataType({
      field,
      value: record[field],
      ...rules
    });

    if (!validation.isValid) {
      result.isValid = false;
      result.errors.push(...validation.errors);
    }
    result.warnings.push(...validation.warnings);
  }

  return result;
}

/**
 * Handles database transaction with automatic rollback on error
 */
export async function withTransaction<T>(
  pool: Pool,
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Sets session variables for row-level security
 */
export async function setSecurityContext(
  client: any,
  userId: string,
  additionalContext: { [key: string]: string } = {}
): Promise<void> {
  await client.query(`SET LOCAL "app.user_id" = $1`, [userId]);
  
  for (const [key, value] of Object.entries(additionalContext)) {
    await client.query(`SET LOCAL "app.${key}" = $1`, [value]);
  }
}
