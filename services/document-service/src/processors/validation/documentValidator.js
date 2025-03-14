import { logger } from '../../utils/logger.js';

export class DocumentValidator {
  constructor() {
    this.validationRules = {
      AP: {
        required: ['vendorCode', 'invoiceNumber', 'invoiceDate', 'totalAmount'],
        numeric: ['totalAmount'],
        array: ['items']
      },
      AR: {
        required: ['customerCode', 'invoiceNumber', 'invoiceDate', 'totalAmount'],
        numeric: ['totalAmount'],
        array: ['items']
      }
    };
  }

  async initialize() {
    logger.info('Initializing Document Validator');
  }

  async validateInvoiceData(data, type = 'AP') {
    const rules = this.validationRules[type];
    const errors = [];

    // Check required fields
    for (const field of rules.required) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate numeric fields
    for (const field of rules.numeric) {
      if (data[field] && isNaN(Number(data[field]))) {
        errors.push(`Field ${field} must be numeric`);
      }
    }

    // Validate arrays
    for (const field of rules.array) {
      if (data[field] && !Array.isArray(data[field])) {
        errors.push(`Field ${field} must be an array`);
      }
    }

    // Validate items if present
    if (Array.isArray(data.items)) {
      data.items.forEach((item, index) => {
        if (!item.lineNumber) {
          errors.push(`Item at index ${index} missing line number`);
        }
        if (!item.description) {
          errors.push(`Item at index ${index} missing description`);
        }
        if (isNaN(Number(item.quantity))) {
          errors.push(`Item at index ${index} has invalid quantity`);
        }
        if (isNaN(Number(item.unitPrice))) {
          errors.push(`Item at index ${index} has invalid unit price`);
        }
      });
    }

    // Validate dates
    if (data.invoiceDate) {
      const date = new Date(data.invoiceDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid invoice date format');
      }
    }

    if (data.dueDate) {
      const date = new Date(data.dueDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid due date format');
      }
    }

    // Validate amounts
    if (data.items && Array.isArray(data.items)) {
      const calculatedTotal = data.items.reduce((sum, item) => {
        return sum + (Number(item.quantity) * Number(item.unitPrice));
      }, 0);

      // Allow for small floating-point differences
      const difference = Math.abs(calculatedTotal - Number(data.totalAmount));
      if (difference > 0.01) {
        errors.push('Total amount does not match sum of line items');
      }
    }

    // Additional type-specific validations
    if (type === 'AR' && data.salesTaxCode) {
      // Validate tax calculations if tax code is present
      if (!data.taxAmount || isNaN(Number(data.taxAmount))) {
        errors.push('Invalid tax amount for AR invoice with tax code');
      }
    }

    if (errors.length > 0) {
      const error = new Error('Document validation failed');
      error.validationErrors = errors;
      throw error;
    }

    return true;
  }

  validateFileFormat(filename, allowedFormats) {
    const extension = filename.split('.').pop().toLowerCase();
    if (!allowedFormats.includes(extension)) {
      throw new Error(`Unsupported file format: ${extension}. Allowed formats: ${allowedFormats.join(', ')}`);
    }
    return true;
  }

  validateFileSize(size, maxSize = 10 * 1024 * 1024) { // Default 10MB
    if (size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }
    return true;
  }
}
