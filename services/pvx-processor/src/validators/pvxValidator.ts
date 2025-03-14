import { logger } from '../utils/logger';
import { PVXFileType, ModuleType, APModuleType, ARModuleType, ValidationError } from '../types';

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validate PVX file content
 */
export async function validatePVX(
  fileContent: string,
  fileType: PVXFileType
): Promise<ValidationResult> {
  logger.info(`Validating ${fileType} file`);

  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Basic file structure validation
    validateFileStructure(fileContent, result);

    // Validate based on module type
    const moduleType = determineModuleType(fileType);
    switch (moduleType) {
      case ModuleType.AP:
        validateAPModule(fileContent, fileType as APModuleType, result);
        break;
      case ModuleType.AR:
        validateARModule(fileContent, fileType as ARModuleType, result);
        break;
      default:
        result.warnings.push(`Unknown module type: ${moduleType}`);
    }

    // Check for data type compatibility
    validateDataTypes(fileContent, result);

    // Validate field constraints
    validateFieldConstraints(fileContent, result);

    // Set overall validation status
    result.isValid = result.errors.length === 0;

    return result;
  } catch (error) {
    logger.error('Error in PVX validation:', error);
    throw error;
  }
}

/**
 * Validate basic PVX file structure
 */
function validateFileStructure(content: string, result: ValidationResult): void {
  const lines = content.split('\n');

  // Check for empty file
  if (lines.length === 0) {
    result.errors.push({
      code: 'EMPTY_FILE',
      message: 'File is empty'
    });
    return;
  }

  // Check for required sections
  const hasHeader = lines.some(line => line.includes('HEADER'));
  const hasFields = lines.some(line => line.includes('FIELD'));
  const hasEnd = lines.some(line => line.includes('END'));

  if (!hasHeader) {
    result.errors.push({
      code: 'MISSING_HEADER',
      message: 'File is missing HEADER section'
    });
  }

  if (!hasFields) {
    result.errors.push({
      code: 'MISSING_FIELDS',
      message: 'File is missing FIELD definitions'
    });
  }

  if (!hasEnd) {
    result.errors.push({
      code: 'MISSING_END',
      message: 'File is missing END marker'
    });
  }
}

/**
 * Validate AP module specific requirements
 */
function validateAPModule(
  content: string,
  moduleType: APModuleType,
  result: ValidationResult
): void {
  const lines = content.split('\n');

  // Validate module-specific fields
  switch (moduleType) {
    case APModuleType.AP0_DIV:
      validateRequiredFields(lines, ['DIV_CODE', 'DIV_NAME'], result);
      break;
    case APModuleType.AP2_TERM:
      validateRequiredFields(lines, ['TERM_CODE', 'DESCRIPTION', 'DAYS'], result);
      break;
    case APModuleType.AP4_VEND:
      validateRequiredFields(
        lines,
        ['VEND_CODE', 'VEND_NAME', 'ADDRESS1', 'CITY', 'STATE'],
        result
      );
      break;
    // Add other AP module validations...
  }
}

/**
 * Validate AR module specific requirements
 */
function validateARModule(
  content: string,
  moduleType: ARModuleType,
  result: ValidationResult
): void {
  const lines = content.split('\n');

  // Validate module-specific fields
  switch (moduleType) {
    case ARModuleType.AR1_CUST:
      validateRequiredFields(
        lines,
        ['CUST_CODE', 'CUST_NAME', 'ADDRESS1', 'CITY', 'STATE'],
        result
      );
      break;
    case ARModuleType.AR2_TERMS:
      validateRequiredFields(
        lines,
        ['TERM_CODE', 'DESCRIPTION', 'DAYS'],
        result
      );
      break;
    case ARModuleType.AR5_SLSTAX:
      validateRequiredFields(
        lines,
        ['TAX_CODE', 'DESCRIPTION', 'RATE'],
        result
      );
      break;
    // Add other AR module validations...
  }
}

/**
 * Validate required fields are present
 */
function validateRequiredFields(
  lines: string[],
  requiredFields: string[],
  result: ValidationResult
): void {
  const fieldDefinitions = lines.filter(line => line.includes('FIELD'));
  const definedFields = fieldDefinitions.map(line => {
    const match = line.match(/FIELD\s+(\w+)/);
    return match ? match[1] : '';
  });

  requiredFields.forEach(field => {
    if (!definedFields.includes(field)) {
      result.errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: `Required field ${field} is missing`,
        field
      });
    }
  });
}

/**
 * Validate data types for compatibility with PostgreSQL
 */
function validateDataTypes(content: string, result: ValidationResult): void {
  const lines = content.split('\n');
  const fieldDefinitions = lines.filter(line => line.includes('FIELD'));

  fieldDefinitions.forEach((line, index) => {
    const match = line.match(/FIELD\s+(\w+)\s+(\w+)(?:\((\d+)(?:,(\d+))?\))?/);
    if (match) {
      const [, fieldName, type, length, scale] = match;

      // Validate numeric fields
      if (type === 'NUMBER') {
        if (!length || !scale) {
          result.warnings.push(
            `Field ${fieldName} should specify precision and scale for PostgreSQL compatibility`
          );
        } else if (parseInt(length) > 14 || parseInt(scale) > 3) {
          result.warnings.push(
            `Field ${fieldName} exceeds recommended precision/scale (14,3) for PostgreSQL`
          );
        }
      }

      // Validate character fields
      if (type === 'CHAR' && (!length || parseInt(length) > 255)) {
        result.warnings.push(
          `Field ${fieldName} should specify length <= 255 for optimal PostgreSQL performance`
        );
      }

      // Validate date fields
      if (type === 'DATE') {
        result.warnings.push(
          `Field ${fieldName} will be converted to TIMESTAMP WITH TIME ZONE`
        );
      }
    }
  });
}

/**
 * Validate field constraints and relationships
 */
function validateFieldConstraints(content: string, result: ValidationResult): void {
  const lines = content.split('\n');
  const fieldDefinitions = lines.filter(line => line.includes('FIELD'));

  // Check for primary key fields
  const hasPrimaryKey = fieldDefinitions.some(line => 
    line.toLowerCase().includes('primary') || 
    line.toLowerCase().includes('key') ||
    line.includes('_ID')
  );

  if (!hasPrimaryKey) {
    result.warnings.push(
      'No primary key field found. A UUID primary key will be added during migration.'
    );
  }

  // Check for foreign key relationships
  fieldDefinitions.forEach(line => {
    const match = line.match(/FIELD\s+(\w+)/);
    if (match) {
      const [, fieldName] = match;
      if (fieldName.endsWith('_ID') || fieldName.endsWith('_CODE')) {
        const referencedTable = fieldName
          .replace(/_ID$/, '')
          .replace(/_CODE$/, '')
          .toLowerCase();
        
        result.warnings.push(
          `Field ${fieldName} appears to reference table ${referencedTable}. ` +
          'Foreign key constraint will be added during migration.'
        );
      }
    }
  });
}

/**
 * Determine the module type from file type
 */
function determineModuleType(fileType: string): ModuleType {
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

/**
 * Validate PVX file content based on module type
 */
export async function validatePVXFile(
  fileContent: string,
  fileType: string
): Promise<ValidationResult> {
  logger.info(`Validating ${fileType} file`);

  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  try {
    // Basic file structure validation
    if (!fileContent.includes('HEADER')) {
      errors.push({
        code: 'MISSING_HEADER',
        message: 'File is missing HEADER section'
      });
    }

    if (!fileContent.includes('DATA')) {
      errors.push({
        code: 'MISSING_DATA',
        message: 'File is missing DATA section'
      });
    }

    // Module-specific validation
    if (fileType.startsWith('AP')) {
      validateAPModuleFile(fileContent, fileType as APModuleType, errors, warnings);
    } else if (fileType.startsWith('AR')) {
      validateARModuleFile(fileContent, fileType as ARModuleType, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    logger.error('Error validating PVX file:', error);
    throw error;
  }
}

/**
 * Validate AP module specific requirements
 */
function validateAPModuleFile(
  content: string,
  moduleType: APModuleType,
  errors: ValidationError[],
  warnings: string[]
): void {
  const lines = content.split('\n').map(line => line.trim());
  let currentSection = '';
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;

    if (line === 'HEADER') {
      currentSection = 'HEADER';
      continue;
    } else if (line === 'DATA') {
      currentSection = 'DATA';
      continue;
    } else if (line === 'END') {
      currentSection = '';
      continue;
    }

    if (currentSection === 'DATA') {
      // Validate AP module specific fields
      switch (moduleType) {
        case APModuleType.AP0_DIV:
          validateDivisionFields(line, lineNumber, errors);
          break;
        case APModuleType.AP2_TERM:
          validateTermFields(line, lineNumber, errors);
          break;
        case APModuleType.AP4_VEND:
          validateVendorFields(line, lineNumber, errors);
          break;
        case APModuleType.AP5_VENDSTATUS:
          validate1099Fields(line, lineNumber, errors);
          break;
        case APModuleType.APA_INVOICEENTMANCHK:
          validateInvoiceFields(line, lineNumber, errors);
          break;
      }
    }
  }
}

/**
 * Validate AR module specific requirements
 */
function validateARModuleFile(
  content: string,
  moduleType: ARModuleType,
  errors: ValidationError[],
  warnings: string[]
): void {
  const lines = content.split('\n').map(line => line.trim());
  let currentSection = '';
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;

    if (line === 'HEADER') {
      currentSection = 'HEADER';
      continue;
    } else if (line === 'DATA') {
      currentSection = 'DATA';
      continue;
    } else if (line === 'END') {
      currentSection = '';
      continue;
    }

    if (currentSection === 'DATA') {
      // Validate AR module specific fields
      switch (moduleType) {
        case ARModuleType.AR1_CUST:
          validateCustomerFields(line, lineNumber, errors);
          break;
        case ARModuleType.AR2_TERMS:
          validateTermFields(line, lineNumber, errors);
          break;
        case ARModuleType.AR5_SLSTAX:
          validateSalesTaxFields(line, lineNumber, errors);
          break;
        case ARModuleType.AR6_OPENINVOICE:
          validateOpenInvoiceFields(line, lineNumber, errors);
          break;
      }
    }
  }
}

/**
 * Validate division fields
 */
function validateDivisionFields(line: string, lineNumber: number, errors: ValidationError[]): void {
  const divCodeMatch = line.match(/DIV_CODE=(.+)/);
  const divNameMatch = line.match(/DIV_NAME=(.+)/);

  if (divCodeMatch && divCodeMatch[1].length > 10) {
    errors.push({
      code: 'INVALID_DIV_CODE',
      message: 'Division code exceeds maximum length of 10 characters',
      line: lineNumber,
      field: 'DIV_CODE'
    });
  }

  if (divNameMatch && divNameMatch[1].length > 50) {
    errors.push({
      code: 'INVALID_DIV_NAME',
      message: 'Division name exceeds maximum length of 50 characters',
      line: lineNumber,
      field: 'DIV_NAME'
    });
  }
}

/**
 * Validate vendor fields
 */
function validateVendorFields(line: string, lineNumber: number, errors: ValidationError[]): void {
  const vendCodeMatch = line.match(/VEND_CODE=(.+)/);
  const vendNameMatch = line.match(/VEND_NAME=(.+)/);
  const vendAddressMatch = line.match(/VEND_ADDRESS=(.+)/);

  if (vendCodeMatch && vendCodeMatch[1].length > 15) {
    errors.push({
      code: 'INVALID_VEND_CODE',
      message: 'Vendor code exceeds maximum length of 15 characters',
      line: lineNumber,
      field: 'VEND_CODE'
    });
  }

  if (vendNameMatch && vendNameMatch[1].length > 100) {
    errors.push({
      code: 'INVALID_VEND_NAME',
      message: 'Vendor name exceeds maximum length of 100 characters',
      line: lineNumber,
      field: 'VEND_NAME'
    });
  }

  if (vendAddressMatch && vendAddressMatch[1].length > 200) {
    errors.push({
      code: 'INVALID_VEND_ADDRESS',
      message: 'Vendor address exceeds maximum length of 200 characters',
      line: lineNumber,
      field: 'VEND_ADDRESS'
    });
  }
}

/**
 * Validate customer fields
 */
function validateCustomerFields(line: string, lineNumber: number, errors: ValidationError[]): void {
  const custCodeMatch = line.match(/CUST_CODE=(.+)/);
  const custNameMatch = line.match(/CUST_NAME=(.+)/);
  const custAddressMatch = line.match(/CUST_ADDRESS=(.+)/);

  if (custCodeMatch && custCodeMatch[1].length > 15) {
    errors.push({
      code: 'INVALID_CUST_CODE',
      message: 'Customer code exceeds maximum length of 15 characters',
      line: lineNumber,
      field: 'CUST_CODE'
    });
  }

  if (custNameMatch && custNameMatch[1].length > 100) {
    errors.push({
      code: 'INVALID_CUST_NAME',
      message: 'Customer name exceeds maximum length of 100 characters',
      line: lineNumber,
      field: 'CUST_NAME'
    });
  }

  if (custAddressMatch && custAddressMatch[1].length > 200) {
    errors.push({
      code: 'INVALID_CUST_ADDRESS',
      message: 'Customer address exceeds maximum length of 200 characters',
      line: lineNumber,
      field: 'CUST_ADDRESS'
    });
  }
}

/**
 * Validate payment term fields
 */
function validateTermFields(line: string, lineNumber: number, errors: ValidationError[]): void {
  const termCodeMatch = line.match(/TERM_CODE=(.+)/);
  const termDescMatch = line.match(/TERM_DESC=(.+)/);
  const termDaysMatch = line.match(/TERM_DAYS=(\d+)/);

  if (termCodeMatch && termCodeMatch[1].length > 10) {
    errors.push({
      code: 'INVALID_TERM_CODE',
      message: 'Term code exceeds maximum length of 10 characters',
      line: lineNumber,
      field: 'TERM_CODE'
    });
  }

  if (termDescMatch && termDescMatch[1].length > 50) {
    errors.push({
      code: 'INVALID_TERM_DESC',
      message: 'Term description exceeds maximum length of 50 characters',
      line: lineNumber,
      field: 'TERM_DESC'
    });
  }

  if (termDaysMatch && (parseInt(termDaysMatch[1]) < 0 || parseInt(termDaysMatch[1]) > 999)) {
    errors.push({
      code: 'INVALID_TERM_DAYS',
      message: 'Term days must be between 0 and 999',
      line: lineNumber,
      field: 'TERM_DAYS'
    });
  }
}

/**
 * Validate 1099 fields
 */
function validate1099Fields(line: string, lineNumber: number, errors: ValidationError[]): void {
  const taxIdMatch = line.match(/TAX_ID=(.+)/);
  const taxTypeMatch = line.match(/TAX_TYPE=(.+)/);

  if (taxIdMatch && !/^\d{9}$/.test(taxIdMatch[1])) {
    errors.push({
      code: 'INVALID_TAX_ID',
      message: 'Tax ID must be exactly 9 digits',
      line: lineNumber,
      field: 'TAX_ID'
    });
  }

  if (taxTypeMatch && !['MISC', 'DIV', 'INT'].includes(taxTypeMatch[1])) {
    errors.push({
      code: 'INVALID_TAX_TYPE',
      message: 'Tax type must be one of: MISC, DIV, INT',
      line: lineNumber,
      field: 'TAX_TYPE'
    });
  }
}

/**
 * Validate invoice fields
 */
function validateInvoiceFields(line: string, lineNumber: number, errors: ValidationError[]): void {
  const invoiceNumMatch = line.match(/INVOICE_NUM=(.+)/);
  const amountMatch = line.match(/AMOUNT=(\d+(\.\d{1,3})?)/);
  const dateMatch = line.match(/DATE=(\d{8})/);

  if (invoiceNumMatch && invoiceNumMatch[1].length > 20) {
    errors.push({
      code: 'INVALID_INVOICE_NUM',
      message: 'Invoice number exceeds maximum length of 20 characters',
      line: lineNumber,
      field: 'INVOICE_NUM'
    });
  }

  if (amountMatch && parseFloat(amountMatch[1]) > 9999999999.999) {
    errors.push({
      code: 'INVALID_AMOUNT',
      message: 'Amount exceeds maximum value of 9,999,999,999.999',
      line: lineNumber,
      field: 'AMOUNT'
    });
  }

  if (dateMatch) {
    const year = parseInt(dateMatch[1].substring(0, 4));
    const month = parseInt(dateMatch[1].substring(4, 6));
    const day = parseInt(dateMatch[1].substring(6, 8));
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      errors.push({
        code: 'INVALID_DATE',
        message: 'Invalid date format (must be YYYYMMDD)',
        line: lineNumber,
        field: 'DATE'
      });
    }
  }
}

/**
 * Validate sales tax fields
 */
function validateSalesTaxFields(line: string, lineNumber: number, errors: ValidationError[]): void {
  const taxCodeMatch = line.match(/TAX_CODE=(.+)/);
  const rateMatch = line.match(/RATE=(\d+(\.\d{1,3})?)/);
  const stateMatch = line.match(/STATE=(.+)/);

  if (taxCodeMatch && taxCodeMatch[1].length > 10) {
    errors.push({
      code: 'INVALID_TAX_CODE',
      message: 'Tax code exceeds maximum length of 10 characters',
      line: lineNumber,
      field: 'TAX_CODE'
    });
  }

  if (rateMatch && (parseFloat(rateMatch[1]) < 0 || parseFloat(rateMatch[1]) > 100)) {
    errors.push({
      code: 'INVALID_RATE',
      message: 'Tax rate must be between 0 and 100',
      line: lineNumber,
      field: 'RATE'
    });
  }

  if (stateMatch && stateMatch[1].length !== 2) {
    errors.push({
      code: 'INVALID_STATE',
      message: 'State must be a 2-letter code',
      line: lineNumber,
      field: 'STATE'
    });
  }
}

/**
 * Validate open invoice fields
 */
function validateOpenInvoiceFields(line: string, lineNumber: number, errors: ValidationError[]): void {
  const invoiceNumMatch = line.match(/INVOICE_NUM=(.+)/);
  const balanceMatch = line.match(/BALANCE=(\d+(\.\d{1,3})?)/);
  const dueDateMatch = line.match(/DUE_DATE=(\d{8})/);

  if (invoiceNumMatch && invoiceNumMatch[1].length > 20) {
    errors.push({
      code: 'INVALID_INVOICE_NUM',
      message: 'Invoice number exceeds maximum length of 20 characters',
      line: lineNumber,
      field: 'INVOICE_NUM'
    });
  }

  if (balanceMatch && parseFloat(balanceMatch[1]) > 9999999999.999) {
    errors.push({
      code: 'INVALID_BALANCE',
      message: 'Balance exceeds maximum value of 9,999,999,999.999',
      line: lineNumber,
      field: 'BALANCE'
    });
  }

  if (dueDateMatch) {
    const year = parseInt(dueDateMatch[1].substring(0, 4));
    const month = parseInt(dueDateMatch[1].substring(4, 6));
    const day = parseInt(dueDateMatch[1].substring(6, 8));
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      errors.push({
        code: 'INVALID_DUE_DATE',
        message: 'Invalid due date format (must be YYYYMMDD)',
        line: lineNumber,
        field: 'DUE_DATE'
      });
    }
  }
}
