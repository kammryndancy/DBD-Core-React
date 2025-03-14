/**
 * Represents a PVX file type
 */
export type PVXFileType = string;

// Module Types
export enum ModuleType {
  AP = 'AP',
  AR = 'AR',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

// AP Module Types
export enum APModuleType {
  AP0_DIV = 'AP0_DIV',
  AP2_TERM = 'AP2_TERM',
  AP3_VENDCATG = 'AP3_VENDCATG',
  AP4_VEND = 'AP4_VEND',
  AP5_VENDSTATUS = 'AP5_VENDSTATUS',
  AP8_VENDMSG = 'AP8_VENDMSG',
  AP9_VENDSTATS = 'AP9_VENDSTATS',
  APA_INVOICEENTMANCHK = 'APA_INVOICEENTMANCHK',
  UNKNOWN = 'UNKNOWN'
}

// AR Module Types
export enum ARModuleType {
  AR1_CUST = 'AR1_CUST',
  AR2_TERMS = 'AR2_TERMS',
  AR5_SLSTAX = 'AR5_SLSTAX',
  AR6_OPENINVOICE = 'AR6_OPENINVOICE',
  ARA_SLSPERSONSTATS = 'ARA_SLSPERSONSTATS',
  ARB_INVOICEENTHDR = 'ARB_INVOICEENTHDR',
  UNKNOWN = 'UNKNOWN'
}

// PVX Field Types
export type PVXFieldType = 'CHAR' | 'NUMBER' | 'DATE';

// PVX Field Definition
export interface PVXField {
  name: string;
  type: PVXFieldType;
  length?: number;
  scale?: number;
  required?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: {
    table: string;
    field: string;
  };
}

// PostgreSQL Field Types
export type PostgreSQLFieldType =
  | 'UUID'
  | 'VARCHAR'
  | 'DECIMAL'
  | 'TIMESTAMP WITH TIME ZONE'
  | 'BOOLEAN'
  | 'INTEGER'
  | 'TEXT'
  | 'JSONB';

// PostgreSQL Field Definition
export interface PostgreSQLField {
  name: string;
  type: PostgreSQLFieldType;
  length?: number;
  precision?: number;
  scale?: number;
  required?: boolean;
  defaultValue?: string;
  isPrimaryKey?: boolean;
  isAuditField?: boolean;
  isForeignKey?: boolean;
  references?: {
    table: string;
    field: string;
  };
}

// SQL Conversion Options
export interface SQLConversionOptions {
  addAuditFields?: boolean;
  useUuidPrimaryKeys?: boolean;
  addForeignKeyConstraints?: boolean;
  enableRowLevelSecurity?: boolean;
  enableFullTextSearch?: boolean;
}

// Validation Error
export interface ValidationError {
  code: string;
  message: string;
  line?: number;
  field?: string;
  value?: any;
}

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Field Validation Rules
export interface FieldValidationRule {
  type: PVXFieldType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

// Module Validation Schema
export interface ModuleValidationSchema {
  moduleType: ModuleType | APModuleType | ARModuleType;
  fields: {
    [fieldName: string]: FieldValidationRule;
  };
}

// Processing Options
export interface ProcessingOptions extends SQLConversionOptions {
  validateOnly?: boolean;
  skipWarnings?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

// Processing Result
export interface ProcessingResult {
  validation: ValidationResult;
  sql?: string;
  tableName?: string;
  processingTime: number;
  warnings: string[];
}

/**
 * Column definition for database schema
 */
export interface ColumnDefinition {
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  isPrimary?: boolean;
  foreignKey?: string;
}

/**
 * Database table schema
 */
export interface TableSchema {
  tableName: string;
  columns: ColumnDefinition[];
}

/**
 * Legacy data type mappings
 */
export interface DataTypeMapping {
  CHAR: 'VARCHAR';
  'NUMBER(14,3)': 'DECIMAL(14,3)';
  DATE: 'TIMESTAMP WITH TIME ZONE';
}

/**
 * PVX component types
 */
export enum PVXComponentType {
  TF2G = 'tf2g',
  TF2W = 'tf2w',
  TF2Z = 'tf2z'
}

/**
 * Process result
 */
export interface ProcessResult {
  success: boolean;
  module: ModuleType;
  data?: any[];
  sql?: string;
  errors?: ValidationError[];
  warnings?: string[];
}
