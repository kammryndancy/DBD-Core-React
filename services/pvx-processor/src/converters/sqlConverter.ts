import { logger } from '../utils/logger';
import {
  ModuleType,
  APModuleType,
  ARModuleType,
  SQLConversionOptions,
  PVXField,
  PostgreSQLField
} from '../types';

interface TableDefinition {
  name: string;
  fields: PostgreSQLField[];
  primaryKey?: string;
  foreignKeys?: {
    field: string;
    references: {
      table: string;
      field: string;
    };
  }[];
}

/**
 * Convert PVX data to PostgreSQL SQL statements
 */
export async function convertToSQL(
  fileContent: string,
  fileType: string,
  options: SQLConversionOptions = {}
): Promise<string> {
  logger.info(`Converting ${fileType} to SQL`);

  try {
    // Step 1: Parse PVX fields
    const pvxFields = parsePVXFields(fileContent);

    // Step 2: Convert to PostgreSQL fields
    const postgresFields = convertFields(pvxFields, options);

    // Step 3: Generate table definition
    const tableDefinition = generateTableDefinition(fileType, postgresFields, options);

    // Step 4: Generate SQL
    const sql = generateSQL(tableDefinition, options);

    return sql;
  } catch (error) {
    logger.error('Error converting to SQL:', error);
    throw error;
  }
}

/**
 * Parse PVX fields from file content
 */
function parsePVXFields(content: string): PVXField[] {
  const fields: PVXField[] = [];
  const lines = content.split('\n').map(line => line.trim());
  let inFieldSection = false;

  for (const line of lines) {
    if (line.startsWith('FIELD ')) {
      inFieldSection = true;
      const fieldMatch = line.match(/FIELD\s+(\w+)\s+(\w+)(?:\((\d+)(?:,(\d+))?\))?/);
      if (fieldMatch) {
        const [, name, type, length, scale] = fieldMatch;
        fields.push({
          name,
          type: type as 'CHAR' | 'NUMBER' | 'DATE',
          length: length ? parseInt(length) : undefined,
          scale: scale ? parseInt(scale) : undefined
        });
      }
    } else if (inFieldSection && line === '') {
      inFieldSection = false;
    }
  }

  return fields;
}

/**
 * Convert PVX fields to PostgreSQL fields
 */
function convertFields(
  pvxFields: PVXField[],
  options: SQLConversionOptions
): PostgreSQLField[] {
  const postgresFields: PostgreSQLField[] = [];

  // Add UUID primary key if requested
  if (options.useUuidPrimaryKeys) {
    postgresFields.push({
      name: 'id',
      type: 'UUID',
      isPrimaryKey: true,
      defaultValue: 'gen_random_uuid()'
    });
  }

  // Convert PVX fields
  for (const pvxField of pvxFields) {
    const postgresField = convertField(pvxField);
    postgresFields.push(postgresField);
  }

  // Add audit fields if requested
  if (options.addAuditFields) {
    postgresFields.push(
      {
        name: 'created_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        defaultValue: 'CURRENT_TIMESTAMP',
        isAuditField: true
      },
      {
        name: 'updated_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        defaultValue: 'CURRENT_TIMESTAMP',
        isAuditField: true
      },
      {
        name: 'created_by',
        type: 'UUID',
        isAuditField: true
      },
      {
        name: 'updated_by',
        type: 'UUID',
        isAuditField: true
      }
    );
  }

  return postgresFields;
}

/**
 * Convert a single PVX field to PostgreSQL field
 */
function convertField(pvxField: PVXField): PostgreSQLField {
  const baseField: PostgreSQLField = {
    name: pvxField.name.toLowerCase(),
    type: 'VARCHAR',
    required: pvxField.required
  };

  switch (pvxField.type) {
    case 'CHAR':
      baseField.type = 'VARCHAR';
      baseField.length = pvxField.length;
      break;
    case 'NUMBER':
      baseField.type = 'DECIMAL';
      if (pvxField.length && pvxField.scale) {
        baseField.precision = pvxField.length;
        baseField.scale = pvxField.scale;
      }
      break;
    case 'DATE':
      baseField.type = 'TIMESTAMP WITH TIME ZONE';
      break;
  }

  return baseField;
}

/**
 * Generate table definition based on module type
 */
function generateTableDefinition(
  fileType: string,
  fields: PostgreSQLField[],
  options: SQLConversionOptions
): TableDefinition {
  const tableName = getTableName(fileType);
  const foreignKeys = getForeignKeys(fileType);

  const definition: TableDefinition = {
    name: tableName,
    fields,
    primaryKey: fields.find(f => f.isPrimaryKey)?.name,
    foreignKeys
  };

  return definition;
}

/**
 * Get table name based on module type
 */
function getTableName(fileType: string): string {
  // Convert legacy PVX file types to modern table names
  const tableMap: { [key: string]: string } = {
    [APModuleType.AP0_DIV]: 'divisions',
    [APModuleType.AP2_TERM]: 'payment_terms',
    [APModuleType.AP3_VENDCATG]: 'vendor_categories',
    [APModuleType.AP4_VEND]: 'vendors',
    [APModuleType.AP5_VENDSTATUS]: 'vendor_statuses',
    [APModuleType.AP8_VENDMSG]: 'vendor_messages',
    [APModuleType.AP9_VENDSTATS]: 'vendor_statistics',
    [APModuleType.APA_INVOICEENTMANCHK]: 'ap_invoices',
    [ARModuleType.AR1_CUST]: 'customers',
    [ARModuleType.AR2_TERMS]: 'customer_payment_terms',
    [ARModuleType.AR5_SLSTAX]: 'sales_tax_rates',
    [ARModuleType.AR6_OPENINVOICE]: 'ar_invoices',
    [ARModuleType.ARA_SLSPERSONSTATS]: 'salesperson_statistics',
    [ARModuleType.ARB_INVOICEENTHDR]: 'ar_invoice_headers'
  };

  return tableMap[fileType] || fileType.toLowerCase();
}

/**
 * Get foreign key definitions based on module type
 */
function getForeignKeys(fileType: string): { field: string; references: { table: string; field: string } }[] {
  // Define foreign key relationships
  const foreignKeyMap: {
    [key: string]: { field: string; references: { table: string; field: string } }[];
  } = {
    [APModuleType.AP4_VEND]: [
      {
        field: 'division_id',
        references: {
          table: 'divisions',
          field: 'id'
        }
      },
      {
        field: 'category_id',
        references: {
          table: 'vendor_categories',
          field: 'id'
        }
      }
    ],
    [APModuleType.APA_INVOICEENTMANCHK]: [
      {
        field: 'vendor_id',
        references: {
          table: 'vendors',
          field: 'id'
        }
      },
      {
        field: 'payment_term_id',
        references: {
          table: 'payment_terms',
          field: 'id'
        }
      }
    ],
    [ARModuleType.AR1_CUST]: [
      {
        field: 'division_id',
        references: {
          table: 'divisions',
          field: 'id'
        }
      },
      {
        field: 'payment_term_id',
        references: {
          table: 'customer_payment_terms',
          field: 'id'
        }
      }
    ],
    [ARModuleType.AR6_OPENINVOICE]: [
      {
        field: 'customer_id',
        references: {
          table: 'customers',
          field: 'id'
        }
      },
      {
        field: 'sales_tax_id',
        references: {
          table: 'sales_tax_rates',
          field: 'id'
        }
      }
    ]
  };

  return foreignKeyMap[fileType] || [];
}

/**
 * Generate SQL from table definition
 */
function generateSQL(
  tableDefinition: TableDefinition,
  options: SQLConversionOptions
): string {
  let sql = '';

  // Create table
  sql += `CREATE TABLE ${tableDefinition.name} (\n`;
  sql += tableDefinition.fields
    .map(field => {
      let fieldDef = `  ${field.name} ${field.type}`;
      if (field.length) {
        fieldDef += `(${field.length})`;
      } else if (field.precision && field.scale) {
        fieldDef += `(${field.precision},${field.scale})`;
      }
      if (field.required) {
        fieldDef += ' NOT NULL';
      }
      if (field.defaultValue) {
        fieldDef += ` DEFAULT ${field.defaultValue}`;
      }
      if (field.isPrimaryKey) {
        fieldDef += ' PRIMARY KEY';
      }
      return fieldDef;
    })
    .join(',\n');

  // Add foreign key constraints if requested
  if (options.addForeignKeyConstraints && tableDefinition.foreignKeys) {
    sql += ',\n';
    sql += tableDefinition.foreignKeys
      .map(
        fk =>
          `  FOREIGN KEY (${fk.field}) REFERENCES ${fk.references.table}(${fk.references.field})`
      )
      .join(',\n');
  }

  sql += '\n);\n\n';

  // Add row-level security if requested
  if (options.enableRowLevelSecurity) {
    sql += `ALTER TABLE ${tableDefinition.name} ENABLE ROW LEVEL SECURITY;\n\n`;
    sql += `CREATE POLICY ${tableDefinition.name}_policy ON ${tableDefinition.name}\n`;
    sql += `  USING (created_by = current_user_id());\n\n`;
  }

  // Add full-text search if requested
  if (options.enableFullTextSearch) {
    const textColumns = tableDefinition.fields
      .filter(f => f.type === 'VARCHAR')
      .map(f => f.name);

    if (textColumns.length > 0) {
      const vectorName = `${tableDefinition.name}_search`;
      sql += `ALTER TABLE ${tableDefinition.name} ADD COLUMN ${vectorName} tsvector\n`;
      sql += `  GENERATED ALWAYS AS (to_tsvector('english', `;
      sql += textColumns.map(col => `coalesce(${col}, '')`).join(" || ' ' || ");
      sql += `)) STORED;\n\n`;

      sql += `CREATE INDEX ${vectorName}_idx ON ${tableDefinition.name} USING GIN (${vectorName});\n\n`;
    }
  }

  // Add triggers for audit fields
  if (options.addAuditFields) {
    sql += `CREATE TRIGGER ${tableDefinition.name}_audit_trigger\n`;
    sql += `  BEFORE UPDATE ON ${tableDefinition.name}\n`;
    sql += `  FOR EACH ROW\n`;
    sql += `  EXECUTE FUNCTION update_audit_fields();\n\n`;
  }

  return sql;
}

/**
 * Generate audit trigger function
 */
export function generateAuditTriggerFunction(): string {
  return `
CREATE OR REPLACE FUNCTION update_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = current_user_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;
}
