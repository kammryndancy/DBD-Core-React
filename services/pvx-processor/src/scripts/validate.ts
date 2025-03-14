import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { withTransaction } from '../db/utils';
import { moduleDefinitions } from '../processors/pvxProcessor';

interface ValidationOptions {
  checkDataTypes?: boolean;
  checkConstraints?: boolean;
  checkAuditFields?: boolean;
  checkRelationships?: boolean;
  checkIndexes?: boolean;
  checkRLS?: boolean;
  checkSearch?: boolean;
}

interface ValidationResult {
  module: string;
  table: string;
  status: 'success' | 'error';
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive data validation for PVX migration
 */
export async function validateMigration(
  options: ValidationOptions = {}
): Promise<ValidationResult[]> {
  const pool = new Pool();
  const results: ValidationResult[] = [];

  try {
    await withTransaction(pool, async (client) => {
      // Validate each module
      for (const [moduleType, module] of Object.entries(moduleDefinitions)) {
        const result: ValidationResult = {
          module: moduleType,
          table: module.table,
          status: 'success',
          errors: [],
          warnings: []
        };

        // Check data types
        if (options.checkDataTypes) {
          const columnInfo = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = $1
              AND table_schema = 'public';
          `, [module.table]);

          for (const field of module.fields) {
            const column = columnInfo.rows.find((c: { column_name: string }) => c.column_name === field.name);
            if (!column) {
              result.errors.push(`Column ${field.name} not found in table ${module.table}`);
              continue;
            }

            // Validate data type mapping
            const expectedType = getExpectedPostgresType(field.type, field.length);
            if (!isCompatibleType(column.data_type, expectedType)) {
              result.errors.push(
                `Column ${field.name} has incorrect type: ${column.data_type}, expected: ${expectedType}`
              );
            }
          }
        }

        // Check constraints and relationships
        if (options.checkConstraints && module.relationships) {
          const constraints = await client.query(`
            SELECT tc.constraint_type, kcu.column_name,
                   ccu.table_name as foreign_table_name,
                   ccu.column_name as foreign_column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = $1
              AND tc.table_schema = 'public';
          `, [module.table]);

          // Check foreign key constraints
          for (const [field, rel] of Object.entries(module.relationships)) {
            const fkConstraint = constraints.rows.find((constraint: {
              constraint_type: string;
              column_name: string;
              foreign_table_name: string;
            }) => 
              constraint.constraint_type === 'FOREIGN KEY' &&
              constraint.column_name === `${field}_id` &&
              constraint.foreign_table_name === rel.table
            );

            if (!fkConstraint) {
              result.errors.push(
                `Missing foreign key constraint for ${field}_id referencing ${rel.table}`
              );
            }
          }
        }

        // Check audit fields
        if (options.checkAuditFields) {
          const auditFields = await client.query(`
            SELECT column_name
            FROM information_schema.columns actual
            WHERE actual.table_name = $1
              AND actual.table_schema = 'public'
              AND actual.column_name IN ('created_at', 'updated_at', 'created_by', 'updated_by');
          `, [module.table]);

          if (auditFields.rowCount === 0) {
            result.errors.push('Missing audit fields');
          } else {
            const missingFields = ['created_at', 'updated_at', 'created_by', 'updated_by'].filter(
              field => !auditFields.rows.some((row: { column_name: string }) => row.column_name === field)
            );
            if (missingFields.length > 0) {
              result.errors.push(`Missing audit fields: ${missingFields.join(', ')}`);
            }
          }
        }

        // Check indexes
        if (options.checkIndexes) {
          const indexes = await client.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = $1
              AND schemaname = 'public';
          `, [module.table]);

          // Check primary key index
          if (!indexes.rows.some((idx: { indexdef: string }) => idx.indexdef.includes('PRIMARY KEY'))) {
            result.errors.push('Missing primary key index');
          }

          // Check foreign key indexes
          if (module.relationships) {
            for (const field of Object.keys(module.relationships)) {
              if (!indexes.rows.some((idx: { indexdef: string }) => 
                idx.indexdef.toLowerCase().includes(`${field}_id`)
              )) {
                result.warnings.push(`Missing index on foreign key: ${field}_id`);
              }
            }
          }
        }

        // Check row-level security
        if (options.checkRLS) {
          const rlsEnabled = await client.query(`
            SELECT relrowsecurity
            FROM pg_class
            WHERE relname = $1
              AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
          `, [module.table]);

          if (!rlsEnabled.rows[0]?.relrowsecurity) {
            result.errors.push('Row-level security not enabled');
          }

          const policies = await client.query(`
            SELECT polname
            FROM pg_policy
            WHERE tablename = $1;
          `, [module.table]);

          if (policies.rowCount === 0) {
            result.errors.push('No RLS policies defined');
          }
        }

        // Check full-text search
        if (options.checkSearch) {
          const searchVector = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1
              AND table_schema = 'public'
              AND column_name = 'search_vector'
              AND data_type = 'tsvector';
          `, [module.table]);

          if (searchVector.rowCount === 0) {
            result.warnings.push('Full-text search vector not configured');
          } else {
            const searchIndex = await client.query(`
              SELECT indexname
              FROM pg_indexes
              WHERE tablename = $1
                AND indexdef LIKE '%search_vector%'
                AND indexdef LIKE '%gin%';
            `, [module.table]);

            if (searchIndex.rowCount === 0) {
              result.errors.push('Missing GIN index on search_vector');
            }
          }
        }

        // Update result status
        result.status = result.errors.length > 0 ? 'error' : 'success';
        results.push(result);
      }
    });

    return results;
  } finally {
    await pool.end();
  }
}

/**
 * Get expected PostgreSQL type based on PVX type
 */
function getExpectedPostgresType(pvxType: string, length?: number): string {
  switch (pvxType) {
    case 'CHAR':
    case 'VARCHAR':
      return length ? `character varying(${length})` : 'character varying';
    case 'NUMBER':
    case 'DECIMAL':
      return 'numeric(14,3)';
    case 'DATE':
      return 'timestamp with time zone';
    case 'BOOLEAN':
      return 'boolean';
    case 'UUID':
      return 'uuid';
    default:
      return 'text';
  }
}

/**
 * Check if PostgreSQL types are compatible
 */
function isCompatibleType(actual: string, expected: string): boolean {
  // Normalize types for comparison
  actual = actual.toLowerCase();
  expected = expected.toLowerCase();

  // Direct match
  if (actual === expected) return true;

  // Compatible types
  const compatibleTypes: { [key: string]: string[] } = {
    'character varying': ['varchar', 'text'],
    'numeric': ['decimal', 'number'],
    'timestamp with time zone': ['timestamptz', 'timestamp'],
    'boolean': ['bool'],
    'uuid': ['uuid']
  };

  return compatibleTypes[expected]?.includes(actual) || false;
}

/**
 * Perform data quality checks
 */
export async function checkDataQuality(pool: Pool): Promise<void> {
  await withTransaction(pool, async (client) => {
    // Check for null values in required fields
    for (const [moduleType, module] of Object.entries(moduleDefinitions)) {
      const requiredFields = module.fields
        .filter(f => f.required)
        .map(f => f.name);

      if (requiredFields.length > 0) {
        const nullCheck = await client.query(`
          SELECT ${requiredFields.join(', ')}
          FROM ${module.table}
          WHERE ${requiredFields.map(f => `${f} IS NULL`).join(' OR ')};
        `);

        if (nullCheck.rowCount > 0) {
          logger.error(`Found null values in required fields for ${moduleType}:`,
            nullCheck.rows);
        }
      }
    }

    // Check for orphaned records
    for (const [moduleType, module] of Object.entries(moduleDefinitions)) {
      if (module.relationships) {
        for (const [field, rel] of Object.entries(module.relationships)) {
          const orphanCheck = await client.query(`
            SELECT a.id, a.${field}_id
            FROM ${module.table} a
            LEFT JOIN ${rel.table} b ON a.${field}_id = b.id
            WHERE a.${field}_id IS NOT NULL
              AND b.id IS NULL;
          `);

          if (orphanCheck.rowCount > 0) {
            logger.error(`Found orphaned records in ${moduleType} referencing ${rel.table}:`,
              orphanCheck.rows);
          }
        }
      }
    }

    // Check for duplicate values in unique fields
    for (const [moduleType, module] of Object.entries(moduleDefinitions)) {
      const uniqueFields = module.fields
        .filter(f => f.name.endsWith('_code'))
        .map(f => f.name);

      for (const field of uniqueFields) {
        const duplicateCheck = await client.query(`
          SELECT ${field}, COUNT(*)
          FROM ${module.table}
          WHERE ${field} IS NOT NULL
          GROUP BY ${field}
          HAVING COUNT(*) > 1;
        `);

        if (duplicateCheck.rowCount > 0) {
          logger.error(`Found duplicate values in ${moduleType}.${field}:`,
            duplicateCheck.rows);
        }
      }
    }
  });
}

// CLI entry point
if (require.main === module) {
  validateMigration({
    checkDataTypes: true,
    checkConstraints: true,
    checkAuditFields: true,
    checkRelationships: true,
    checkIndexes: true,
    checkRLS: true,
    checkSearch: true
  })
    .then(results => {
      console.log('Validation results:', results);
      const hasErrors = results.some(r => r.status === 'error');
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}
