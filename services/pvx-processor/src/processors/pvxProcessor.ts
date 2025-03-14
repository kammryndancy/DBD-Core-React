import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { validateDataType, withTransaction, executeQuery } from '../db/utils';
import { dataTypeMappings } from '../config/database';

interface PVXField {
  name: string;
  type: string;
  length?: number;
  required?: boolean;
  defaultValue?: any;
}

interface PVXModule {
  name: string;
  table: string;
  fields: PVXField[];
  relationships?: {
    [key: string]: {
      table: string;
      field: string;
    };
  };
}

// Module definitions based on legacy PVX system
const moduleDefinitions: { [key: string]: PVXModule } = {
  // AP Module Definitions
  'AP0_Div': {
    name: 'Divisions',
    table: 'divisions',
    fields: [
      { name: 'division_code', type: 'CHAR', length: 10, required: true },
      { name: 'division_name', type: 'CHAR', length: 100, required: true },
      { name: 'status', type: 'CHAR', length: 20, defaultValue: 'active' }
    ]
  },
  'AP2_Term': {
    name: 'Payment Terms',
    table: 'payment_terms',
    fields: [
      { name: 'term_code', type: 'CHAR', length: 10, required: true },
      { name: 'description', type: 'CHAR', length: 100, required: true },
      { name: 'days_until_due', type: 'NUMBER', required: true },
      { name: 'discount_percentage', type: 'NUMBER' },
      { name: 'discount_days', type: 'NUMBER' },
      { name: 'module_type', type: 'CHAR', length: 2, required: true }
    ]
  },
  'AP3_VendCatg': {
    name: 'Vendor Categories',
    table: 'vendor_categories',
    fields: [
      { name: 'category_code', type: 'CHAR', length: 10, required: true },
      { name: 'description', type: 'CHAR', length: 100, required: true }
    ]
  },
  'AP4_Vend': {
    name: 'Vendors',
    table: 'vendors',
    fields: [
      { name: 'vendor_code', type: 'CHAR', length: 20, required: true },
      { name: 'vendor_name', type: 'CHAR', length: 100, required: true },
      { name: 'division_id', type: 'UUID', required: true },
      { name: 'category_id', type: 'UUID' },
      { name: 'status_id', type: 'UUID' },
      { name: 'payment_terms_id', type: 'UUID' },
      { name: 'tax_id', type: 'CHAR', length: 20 },
      { name: 'address_line1', type: 'CHAR', length: 100 },
      { name: 'address_line2', type: 'CHAR', length: 100 },
      { name: 'city', type: 'CHAR', length: 50 },
      { name: 'state', type: 'CHAR', length: 2 },
      { name: 'zip_code', type: 'CHAR', length: 10 },
      { name: 'contact_name', type: 'CHAR', length: 100 },
      { name: 'phone', type: 'CHAR', length: 20 },
      { name: 'email', type: 'CHAR', length: 100 }
    ],
    relationships: {
      division: { table: 'divisions', field: 'id' },
      category: { table: 'vendor_categories', field: 'id' },
      status: { table: 'vendor_status', field: 'id' },
      payment_terms: { table: 'payment_terms', field: 'id' }
    }
  },

  // AR Module Definitions
  'AR1_Cust': {
    name: 'Customers',
    table: 'customers',
    fields: [
      { name: 'customer_code', type: 'CHAR', length: 20, required: true },
      { name: 'customer_name', type: 'CHAR', length: 100, required: true },
      { name: 'division_id', type: 'UUID', required: true },
      { name: 'payment_terms_id', type: 'UUID' },
      { name: 'credit_limit', type: 'NUMBER' },
      { name: 'tax_exempt', type: 'BOOLEAN', defaultValue: false },
      { name: 'tax_id', type: 'CHAR', length: 20 },
      { name: 'address_line1', type: 'CHAR', length: 100 },
      { name: 'address_line2', type: 'CHAR', length: 100 },
      { name: 'city', type: 'CHAR', length: 50 },
      { name: 'state', type: 'CHAR', length: 2 },
      { name: 'zip_code', type: 'CHAR', length: 10 },
      { name: 'contact_name', type: 'CHAR', length: 100 },
      { name: 'phone', type: 'CHAR', length: 20 },
      { name: 'email', type: 'CHAR', length: 100 }
    ],
    relationships: {
      division: { table: 'divisions', field: 'id' },
      payment_terms: { table: 'payment_terms', field: 'id' }
    }
  }
};

export class PVXProcessor {
  constructor(private pool: Pool) {}

  /**
   * Process a PVX file and convert it to modern PostgreSQL format
   */
  async processPVXFile(
    fileContent: string,
    moduleType: string,
    options: {
      validateOnly?: boolean;
      skipWarnings?: boolean;
      addAuditFields?: boolean;
      useUuidPrimaryKeys?: boolean;
      addForeignKeyConstraints?: boolean;
      enableRowLevelSecurity?: boolean;
      enableFullTextSearch?: boolean;
    } = {}
  ) {
    const module = moduleDefinitions[moduleType];
    if (!module) {
      throw new Error(`Unsupported module type: ${moduleType}`);
    }

    // Parse PVX file content
    const records = this.parsePVXContent(fileContent);

    // Validate records
    const validationResults = records.map(record => 
      this.validateRecord(record, module.fields)
    );

    const hasErrors = validationResults.some(result => !result.isValid);
    if (hasErrors) {
      return {
        isValid: false,
        errors: validationResults.flatMap(result => result.errors),
        warnings: validationResults.flatMap(result => result.warnings)
      };
    }

    if (options.validateOnly) {
      return {
        isValid: true,
        errors: [],
        warnings: validationResults.flatMap(result => result.warnings)
      };
    }

    // Convert and insert records
    return await withTransaction(this.pool, async (client) => {
      const convertedRecords = records.map(record => 
        this.convertRecord(record, module.fields)
      );

      const insertQueries = convertedRecords.map(record => ({
        text: this.buildInsertQuery(module.table, record, options),
        values: Object.values(record)
      }));

      const results = await Promise.all(
        insertQueries.map(query => executeQuery(this.pool, query.text, query.values))
      );

      return {
        isValid: true,
        recordCount: results.reduce((sum, result) => sum + result.rowCount, 0),
        warnings: validationResults.flatMap(result => result.warnings)
      };
    });
  }

  /**
   * Parse PVX file content into records
   */
  private parsePVXContent(content: string): any[] {
    // Split content into lines
    const lines = content.split('\n').filter(line => line.trim());

    // Parse header
    const header = lines[0].split('|').map(field => field.trim());

    // Parse records
    return lines.slice(1).map(line => {
      const values = line.split('|').map(value => value.trim());
      return header.reduce((record, field, index) => {
        record[field] = values[index] || null;
        return record;
      }, {});
    });
  }

  /**
   * Validate a record against module field definitions
   */
  private validateRecord(record: any, fields: PVXField[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    for (const field of fields) {
      const validation = validateDataType({
        field: field.name,
        value: record[field.name],
        type: field.type,
        required: field.required,
        maxLength: field.length
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
   * Convert a record's data types according to mapping rules
   */
  private convertRecord(record: any, fields: PVXField[]): any {
    const converted: any = {};

    for (const field of fields) {
      const value = record[field.name];

      if (value === null || value === undefined) {
        converted[field.name] = field.defaultValue ?? null;
        continue;
      }

      switch (field.type) {
        case 'CHAR':
        case 'VARCHAR':
          converted[field.name] = String(value).trim();
          break;

        case 'NUMBER':
        case 'DECIMAL':
          converted[field.name] = Number(value);
          break;

        case 'DATE':
          converted[field.name] = new Date(value);
          break;

        case 'BOOLEAN':
          converted[field.name] = Boolean(value);
          break;

        case 'UUID':
          converted[field.name] = value; // Assume UUID is already in correct format
          break;

        default:
          converted[field.name] = value;
      }
    }

    return converted;
  }

  /**
   * Build INSERT query for a record
   */
  private buildInsertQuery(
    table: string,
    record: any,
    options: {
      addAuditFields?: boolean;
      useUuidPrimaryKeys?: boolean;
    }
  ): string {
    const fields = Object.keys(record);
    
    if (options.addAuditFields) {
      fields.push('created_at', 'updated_at', 'created_by', 'updated_by');
    }

    if (options.useUuidPrimaryKeys) {
      fields.unshift('id');
    }

    const placeholders = fields.map((_, i) => `$${i + 1}`);

    return `
      INSERT INTO ${table} (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING id
    `;
  }
}

// Export module definitions for reference
export { moduleDefinitions, PVXModule, PVXField };
