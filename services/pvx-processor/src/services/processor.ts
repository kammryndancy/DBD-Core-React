import { 
  ModuleType,
  APModuleType,
  ARModuleType,
  ProcessingOptions,
  ProcessingResult,
  ValidationResult,
  PVXField
} from '../types';
import { logger, performanceLogger, validationLogger, conversionLogger } from '../utils/logger';
import { validatePVX } from '../validators/pvxValidator';
import { convertToSQL, generateAuditTriggerFunction } from '../converters/sqlConverter';
import fs from 'fs/promises';
import path from 'path';

export class PVXProcessor {
  private options: ProcessingOptions;

  constructor(options: ProcessingOptions = {}) {
    this.options = {
      validateOnly: false,
      skipWarnings: false,
      addAuditFields: true,
      useUuidPrimaryKeys: true,
      addForeignKeyConstraints: true,
      enableRowLevelSecurity: true,
      enableFullTextSearch: true,
      logLevel: 'info',
      ...options
    };

    // Set log level
    logger.level = this.options.logLevel || 'info';
  }

  /**
   * Process a PVX file
   */
  public async processFile(filePath: string): Promise<ProcessingResult> {
    const timer = performanceLogger.start(`Processing ${path.basename(filePath)}`);

    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Determine module type
      const moduleType = this.determineModuleType(filePath);

      // Validate file
      const validation = await this.validateFile(content, moduleType);

      // If validation fails or validateOnly is true, return early
      if (!validation.isValid || this.options.validateOnly) {
        return {
          validation,
          processingTime: timer.end(),
          warnings: validation.warnings
        };
      }

      // Convert to SQL
      const sql = await this.convertToSQL(content, moduleType);

      return {
        validation,
        sql,
        tableName: this.getTableName(moduleType),
        processingTime: timer.end(),
        warnings: validation.warnings
      };
    } catch (error) {
      logger.error(`Error processing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Process multiple PVX files
   */
  public async processFiles(filePaths: string[]): Promise<ProcessingResult[]> {
    const timer = performanceLogger.start(`Processing ${filePaths.length} files`);
    const results: ProcessingResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.processFile(filePath);
        results.push(result);
      } catch (error) {
        logger.error(`Error processing file ${filePath}:`, error);
        // Continue processing other files
      }
    }

    timer.end();
    return results;
  }

  /**
   * Validate a PVX file
   */
  private async validateFile(
    content: string,
    moduleType: ModuleType | APModuleType | ARModuleType
  ): Promise<ValidationResult> {
    const timer = performanceLogger.start(`Validating ${moduleType}`);

    try {
      const validation = await validatePVX(content, moduleType);

      // Log validation results
      validationLogger(moduleType, validation.errors, validation.warnings);

      timer.end();
      return validation;
    } catch (error) {
      logger.error(`Error validating ${moduleType}:`, error);
      throw error;
    }
  }

  /**
   * Convert PVX file to SQL
   */
  private async convertToSQL(
    content: string,
    moduleType: ModuleType | APModuleType | ARModuleType
  ): Promise<string> {
    const timer = performanceLogger.start(`Converting ${moduleType} to SQL`);
    const tableName = this.getTableName(moduleType);

    try {
      // Log conversion options
      conversionLogger(moduleType, tableName, this.options);

      // Convert to SQL
      const sql = await convertToSQL(content, moduleType, this.options);

      // Add audit trigger function if needed
      if (this.options.addAuditFields) {
        return `${generateAuditTriggerFunction()}\n\n${sql}`;
      }

      timer.end();
      return sql;
    } catch (error) {
      logger.error(`Error converting ${moduleType} to SQL:`, error);
      throw error;
    }
  }

  /**
   * Determine module type from file path
   */
  private determineModuleType(
    filePath: string
  ): ModuleType | APModuleType | ARModuleType {
    const fileName = path.basename(filePath, '.pvx').toUpperCase();

    // Check AP modules
    if (fileName.startsWith('AP')) {
      const apModule = Object.values(APModuleType).find(
        (type) => type === fileName
      );
      if (apModule) {
        return apModule;
      }
      return ModuleType.AP;
    }

    // Check AR modules
    if (fileName.startsWith('AR')) {
      const arModule = Object.values(ARModuleType).find(
        (type) => type === fileName
      );
      if (arModule) {
        return arModule;
      }
      return ModuleType.AR;
    }

    return ModuleType.UNKNOWN;
  }

  /**
   * Get table name from module type
   */
  private getTableName(moduleType: ModuleType | APModuleType | ARModuleType): string {
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

    return tableMap[moduleType] || moduleType.toLowerCase();
  }
}
