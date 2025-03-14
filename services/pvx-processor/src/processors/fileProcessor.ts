import { logger } from '../utils/logger';
import { ModuleType, APModuleType, ARModuleType, ProcessResult } from '../types';
import { validatePVX } from '../validators/pvxValidator';
import { convertToSQL } from '../converters/sqlConverter';
import { migrationConfig } from '../config/migration';

interface PVXHeader {
  program: string;
  version: string;
}

interface PVXField {
  name: string;
  type: string;
  length?: number;
  scale?: number;
}

interface PVXData {
  [key: string]: string | number | Date;
}

/**
 * Process a PVX file and convert it to a modern format
 */
export async function processFile(
  fileContent: string,
  fileType: string
): Promise<ProcessResult> {
  logger.info(`Processing ${fileType} file`);

  try {
    // Step 1: Validate the file
    const validationResult = await validatePVX(fileContent, fileType);
    if (!validationResult.isValid) {
      return {
        success: false,
        module: determineModuleType(fileType),
        errors: validationResult.errors,
        warnings: validationResult.warnings
      };
    }

    // Step 2: Parse the file content
    const { header, fields, data } = parsePVXContent(fileContent);

    // Step 3: Transform the data
    const transformedData = transformData(data, fields, fileType);

    // Step 4: Generate SQL (if requested)
    const sql = await convertToSQL(fileContent, fileType, {
      useUuidPrimaryKeys: true,
      addAuditFields: true,
      enableRowLevelSecurity: true,
      enableFullTextSearch: true,
      addForeignKeyConstraints: true
    });

    return {
      success: true,
      module: determineModuleType(fileType),
      data: transformedData,
      sql,
      warnings: validationResult.warnings
    };
  } catch (error) {
    logger.error('Error processing PVX file:', error);
    throw error;
  }
}

/**
 * Parse PVX file content into structured data
 */
function parsePVXContent(content: string): {
  header: PVXHeader;
  fields: PVXField[];
  data: PVXData[];
} {
  const lines = content.split('\n').map(line => line.trim());
  const header: PVXHeader = { program: '', version: '' };
  const fields: PVXField[] = [];
  const data: PVXData[] = [];

  let currentSection = '';
  let currentData: PVXData = {};

  for (const line of lines) {
    if (line === '') continue;

    if (line === 'HEADER') {
      currentSection = 'HEADER';
      continue;
    } else if (line === 'END_HEADER') {
      currentSection = '';
      continue;
    } else if (line.startsWith('FIELD ')) {
      const fieldMatch = line.match(/FIELD\s+(\w+)\s+(\w+)(?:\((\d+)(?:,(\d+))?\))?/);
      if (fieldMatch) {
        const [, name, type, length, scale] = fieldMatch;
        fields.push({
          name,
          type,
          length: length ? parseInt(length) : undefined,
          scale: scale ? parseInt(scale) : undefined
        });
      }
      continue;
    } else if (line === 'DATA') {
      currentSection = 'DATA';
      currentData = {};
      continue;
    } else if (line === 'END_DATA') {
      currentSection = '';
      if (Object.keys(currentData).length > 0) {
        data.push({ ...currentData });
      }
      currentData = {};
      continue;
    } else if (line === 'END') {
      break;
    }

    if (currentSection === 'HEADER') {
      const headerMatch = line.match(/(\w+)=(.+)/);
      if (headerMatch) {
        const [, key, value] = headerMatch;
        header[key.toLowerCase() as keyof PVXHeader] = value;
      }
    } else if (currentSection === 'DATA') {
      const dataMatch = line.match(/(\w+)=(.+)/);
      if (dataMatch) {
        const [, key, value] = dataMatch;
        currentData[key] = parseValue(value, fields.find(f => f.name === key));
      }
    }
  }

  return { header, fields, data };
}

/**
 * Parse a value based on its field definition
 */
function parseValue(value: string, field?: PVXField): string | number | Date {
  if (!field) return value;

  switch (field.type) {
    case 'NUMBER':
      return parseFloat(value);
    case 'DATE':
      // Convert YYYYMMDD to ISO date
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    default:
      return value.trim();
  }
}

/**
 * Transform raw data based on module type
 */
function transformData(
  data: PVXData[],
  fields: PVXField[],
  fileType: string
): PVXData[] {
  const moduleType = determineModuleType(fileType);
  const transformedData: PVXData[] = [];

  for (const item of data) {
    const transformed: PVXData = {};

    // Apply common transformations
    for (const [key, value] of Object.entries(item)) {
      const field = fields.find(f => f.name === key);
      if (!field) continue;

      // Convert field names to lowercase
      const newKey = key.toLowerCase();

      // Apply data type transformations
      if (field.type === 'CHAR') {
        transformed[newKey] = value.toString().trim();
      } else if (field.type === 'NUMBER') {
        transformed[newKey] = typeof value === 'number' ? value : parseFloat(value.toString());
      } else if (field.type === 'DATE') {
        transformed[newKey] = value instanceof Date ? value.toISOString() : value;
      } else {
        transformed[newKey] = value;
      }
    }

    // Apply module-specific transformations
    if (moduleType === ModuleType.AP) {
      transformed.id = crypto.randomUUID();
      transformed.created_at = new Date().toISOString();
      transformed.updated_at = new Date().toISOString();

      // Convert specific AP fields
      if ('vend_code' in transformed) {
        transformed.vendor_code = transformed.vend_code;
        delete transformed.vend_code;
      }
      if ('vend_name' in transformed) {
        transformed.vendor_name = transformed.vend_name;
        delete transformed.vend_name;
      }
    } else if (moduleType === ModuleType.AR) {
      transformed.id = crypto.randomUUID();
      transformed.created_at = new Date().toISOString();
      transformed.updated_at = new Date().toISOString();

      // Convert specific AR fields
      if ('cust_code' in transformed) {
        transformed.customer_code = transformed.cust_code;
        delete transformed.cust_code;
      }
      if ('cust_name' in transformed) {
        transformed.customer_name = transformed.cust_name;
        delete transformed.cust_name;
      }
    }

    transformedData.push(transformed);
  }

  return transformedData;
}

/**
 * Determine module type from file type
 */
export function determineModuleType(fileType: string): ModuleType {
  if (fileType.startsWith('AP')) {
    return ModuleType.AP;
  }
  if (fileType.startsWith('AR')) {
    return ModuleType.AR;
  }
  if (fileType.startsWith('tf2')) {
    const componentMap: { [key: string]: ModuleType } = {
      'tf2g': ModuleType.AP,
      'tf2w': ModuleType.AR,
      'tf2z': ModuleType.SYSTEM
    };
    return componentMap[fileType] || ModuleType.UNKNOWN;
  }
  return ModuleType.UNKNOWN;
}
