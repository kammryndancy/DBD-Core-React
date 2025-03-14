import { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger';
import { PVXProcessor } from '../processors/pvxProcessor';
import { withTransaction } from '../db/utils';

interface MigrationOptions {
  sourceDir: string;
  validateOnly?: boolean;
  skipWarnings?: boolean;
  addAuditFields?: boolean;
  useUuidPrimaryKeys?: boolean;
  addForeignKeyConstraints?: boolean;
  enableRowLevelSecurity?: boolean;
  enableFullTextSearch?: boolean;
}

interface MigrationResult {
  module: string;
  status: 'success' | 'error';
  recordCount?: number;
  errors?: string[];
  warnings?: string[];
}

interface ProcessFileResult {
  isValid: boolean;
  recordCount?: number;
  errors?: string[];
  warnings: string[];
}

/**
 * Main migration script for converting PVX files to PostgreSQL
 */
export async function migratePVXData(options: MigrationOptions): Promise<MigrationResult[]> {
  const pool = new Pool();
  const processor = new PVXProcessor(pool);
  const results: MigrationResult[] = [];

  try {
    // Get all .pxprg files from source directory
    const files = await fs.readdir(options.sourceDir);
    const pvxFiles = files.filter(file => file.endsWith('.pxprg'));

    // Process files in correct order based on dependencies
    const processingOrder = [
      // AP Module - Process in order of dependencies
      'AP0_Div',    // Divisions first as they're referenced by others
      'AP2_Term',   // Payment terms
      'AP3_VendCatg', // Vendor categories
      'AP5_VendStatus', // Vendor status
      'AP4_Vend',   // Vendors (depends on above tables)
      'AP8_VendMsg', // Vendor messages (depends on vendors)
      'AP9_VendStats', // Vendor statistics (depends on vendors)
      'APA_InvoiceEntManChk', // AP Invoices (depends on vendors)

      // AR Module - Process in order of dependencies
      'AR2_Terms',  // AR payment terms
      'AR5_SlsTax', // Sales tax
      'AR1_Cust',   // Customers (depends on divisions and terms)
      'AR6_OpenInvoice', // Open invoices (depends on customers)
      'ARA_SlspersonStats', // Salesperson statistics
      'ARB_InvoiceEntHdr'  // AR Invoices (depends on customers)
    ];

    // Process each module in order
    for (const moduleType of processingOrder) {
      const moduleFile = pvxFiles.find(file => file.startsWith(moduleType));
      if (!moduleFile) {
        logger.warn(`No file found for module ${moduleType}`);
        continue;
      }

      try {
        logger.info(`Processing ${moduleType}...`);

        // Read and process file
        const filePath = path.join(options.sourceDir, moduleFile);
        const fileContent = await fs.readFile(filePath, 'utf8');

        // Process the file
        const result = await processor.processPVXFile(fileContent, moduleType, {
          validateOnly: options.validateOnly,
          skipWarnings: options.skipWarnings,
          addAuditFields: options.addAuditFields,
          useUuidPrimaryKeys: options.useUuidPrimaryKeys,
          addForeignKeyConstraints: options.addForeignKeyConstraints,
          enableRowLevelSecurity: options.enableRowLevelSecurity,
          enableFullTextSearch: options.enableFullTextSearch
        }) as ProcessFileResult;

        results.push({
          module: moduleType,
          status: result.isValid ? 'success' : 'error',
          recordCount: result.recordCount,
          errors: result.errors,
          warnings: result.warnings
        });

        logger.info(`Completed ${moduleType}`, {
          recordCount: result.recordCount || 0,
          warnings: result.warnings.length
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error processing ${moduleType}:`, errorMessage);
        results.push({
          module: moduleType,
          status: 'error',
          errors: [errorMessage]
        });
      }
    }

    // Verify data integrity after migration
    if (!options.validateOnly) {
      await verifyDataIntegrity(pool);
    }

    return results;
  } finally {
    await pool.end();
  }
}

/**
 * Verify data integrity after migration
 */
async function verifyDataIntegrity(pool: Pool) {
  await withTransaction(pool, async (client) => {
    // Check foreign key constraints
    const fkViolations = await client.query(`
      SELECT 
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    `);

    // Check for orphaned records
    for (const fk of fkViolations.rows) {
      const violations = await client.query(`
        SELECT COUNT(*) 
        FROM ${fk.table_name} t
        LEFT JOIN ${fk.foreign_table_name} f 
          ON t.${fk.column_name} = f.${fk.foreign_column_name}
        WHERE t.${fk.column_name} IS NOT NULL 
          AND f.${fk.foreign_column_name} IS NULL;
      `);

      if (violations.rows[0].count > 0) {
        logger.error(`Found ${violations.rows[0].count} orphaned records in ${fk.table_name}`);
      }
    }

    // Check for duplicate unique values
    const uniqueConstraints = await client.query(`
      SELECT 
        tc.table_name, kcu.column_name
      FROM 
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public';
    `);

    for (const constraint of uniqueConstraints.rows) {
      const duplicates = await client.query(`
        SELECT ${constraint.column_name}, COUNT(*)
        FROM ${constraint.table_name}
        GROUP BY ${constraint.column_name}
        HAVING COUNT(*) > 1;
      `);

      if (duplicates.rowCount > 0) {
        logger.error(`Found duplicate values in ${constraint.table_name}.${constraint.column_name}`);
      }
    }

    // Verify audit fields
    const auditFieldIssues = await client.query(`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name NOT IN ('audit_logs')
        AND column_name IN ('created_at', 'updated_at', 'created_by', 'updated_by')
        AND column_default IS NULL;
    `);

    if (auditFieldIssues.rowCount > 0) {
      logger.warn('Found tables with audit fields missing defaults:', 
        auditFieldIssues.rows.map((row: { table_name: string }) => row.table_name));
    }

    // Check for missing indexes on frequently queried fields
    const recommendedIndexes = [
      { table: 'vendors', columns: ['vendor_code', 'division_id'] },
      { table: 'customers', columns: ['customer_code', 'division_id'] },
      { table: 'open_invoices', columns: ['invoice_number', 'customer_id', 'status'] }
    ];

    for (const index of recommendedIndexes) {
      const existingIndexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
          AND schemaname = 'public';
      `, [index.table]);

      const missingColumns = index.columns.filter(column => 
        !existingIndexes.rows.some((idx: { indexdef: string }) => 
          idx.indexdef.toLowerCase().includes(column.toLowerCase())
        )
      );

      if (missingColumns.length > 0) {
        logger.warn(`Missing recommended indexes on ${index.table}:`, missingColumns);
      }
    }
  });
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const sourceDir = args[0];

  if (!sourceDir) {
    console.error('Usage: ts-node migrate.ts <sourceDir>');
    process.exit(1);
  }

  migratePVXData({
    sourceDir,
    addAuditFields: true,
    useUuidPrimaryKeys: true,
    addForeignKeyConstraints: true,
    enableRowLevelSecurity: true,
    enableFullTextSearch: true
  })
    .then(results => {
      console.log('Migration completed:', results);
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
