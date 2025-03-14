import Ajv from 'ajv';
import Decimal from 'decimal.js';
import moment from 'moment-timezone';
import { logger } from '../utils/logger.js';
import { dbClient } from '../db/index.js';

// Initialize Ajv instance
const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  useDefaults: true
});

// Global validator instances
let validators = {
  ap: null,
  ar: null,
  common: null
};

// Custom formats for legacy data type validation
ajv.addFormat('varchar', {
  type: 'string',
  validate: (value) => typeof value === 'string'
});

ajv.addFormat('decimal14_3', {
  type: 'string',
  validate: (value) => {
    try {
      const decimal = new Decimal(value);
      // Validate precision (14) and scale (3)
      const parts = decimal.toFixed(3).split('.');
      return parts[0].length <= 11 && (!parts[1] || parts[1].length <= 3);
    } catch {
      return false;
    }
  }
});

ajv.addFormat('timestamp_tz', {
  type: 'string',
  validate: (value) => moment(value, moment.ISO_8601, true).isValid()
});

// Initialize all validators
export const initializeValidators = async () => {
  try {
    // Load validation schemas from database
    const schemas = await loadValidationSchemas();
    
    // Initialize validators with schemas
    validators.ap = createAPValidator(schemas.ap);
    validators.ar = createARValidator(schemas.ar);
    validators.common = createCommonValidator(schemas.common);

    logger.info('Validation schemas initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize validators:', error);
    throw error;
  }
};

// Load validation schemas from database
async function loadValidationSchemas() {
  const client = await dbClient.getClient();
  try {
    const { rows } = await client.query(`
      SELECT module, entity, schema_definition
      FROM validation.schemas
      WHERE active = true
    `);

    const schemas = {
      ap: {},
      ar: {},
      common: {}
    };

    rows.forEach(row => {
      if (row.module === 'AP') {
        schemas.ap[row.entity] = JSON.parse(row.schema_definition);
      } else if (row.module === 'AR') {
        schemas.ar[row.entity] = JSON.parse(row.schema_definition);
      } else {
        schemas.common[row.entity] = JSON.parse(row.schema_definition);
      }
    });

    return schemas;
  } finally {
    client.release();
  }
}

// Create AP validator with schemas
function createAPValidator(schemas) {
  return {
    // Vendor validation (AP4_Vend)
    validateVendor: ajv.compile({
      type: 'object',
      properties: {
        vendorCode: { type: 'string', format: 'varchar', maxLength: 50 },
        name: { type: 'string', format: 'varchar', maxLength: 100 },
        taxId: { type: 'string', format: 'varchar', maxLength: 20 },
        status: { type: 'string', enum: ['A', 'I'] },
        divisionId: { type: 'string', format: 'uuid' },
        paymentTerms: { type: 'string', format: 'varchar', maxLength: 50 },
        created_by: { type: 'string', format: 'varchar' },
        updated_by: { type: 'string', format: 'varchar' }
      },
      required: ['vendorCode', 'name', 'status', 'divisionId']
    }),

    // Invoice validation (APA_InvoiceEntManChk)
    validateInvoice: ajv.compile({
      type: 'object',
      properties: {
        vendorId: { type: 'string', format: 'uuid' },
        invoiceNumber: { type: 'string', format: 'varchar', maxLength: 50 },
        invoiceDate: { type: 'string', format: 'timestamp_tz' },
        dueDate: { type: 'string', format: 'timestamp_tz' },
        amount: { type: 'string', format: 'decimal14_3' },
        status: { type: 'string', enum: ['P', 'A', 'V'] },
        divisionId: { type: 'string', format: 'uuid' },
        created_by: { type: 'string', format: 'varchar' },
        updated_by: { type: 'string', format: 'varchar' }
      },
      required: ['vendorId', 'invoiceNumber', 'invoiceDate', 'amount', 'divisionId']
    })
  };
}

// Create AR validator with schemas
function createARValidator(schemas) {
  return {
    // Customer validation (AR1_Cust)
    validateCustomer: ajv.compile({
      type: 'object',
      properties: {
        customerCode: { type: 'string', format: 'varchar', maxLength: 50 },
        name: { type: 'string', format: 'varchar', maxLength: 100 },
        taxId: { type: 'string', format: 'varchar', maxLength: 20 },
        status: { type: 'string', enum: ['A', 'I'] },
        divisionId: { type: 'string', format: 'uuid' },
        paymentTerms: { type: 'string', format: 'varchar', maxLength: 50 },
        creditLimit: { type: 'string', format: 'decimal14_3' },
        created_by: { type: 'string', format: 'varchar' },
        updated_by: { type: 'string', format: 'varchar' }
      },
      required: ['customerCode', 'name', 'status', 'divisionId']
    }),

    // Invoice validation (ARB_InvoiceEntHdr)
    validateInvoice: ajv.compile({
      type: 'object',
      properties: {
        customerId: { type: 'string', format: 'uuid' },
        invoiceNumber: { type: 'string', format: 'varchar', maxLength: 50 },
        invoiceDate: { type: 'string', format: 'timestamp_tz' },
        dueDate: { type: 'string', format: 'timestamp_tz' },
        amount: { type: 'string', format: 'decimal14_3' },
        salesTaxAmount: { type: 'string', format: 'decimal14_3' },
        status: { type: 'string', enum: ['P', 'A', 'V'] },
        divisionId: { type: 'string', format: 'uuid' },
        created_by: { type: 'string', format: 'varchar' },
        updated_by: { type: 'string', format: 'varchar' }
      },
      required: ['customerId', 'invoiceNumber', 'invoiceDate', 'amount', 'divisionId']
    })
  };
}

// Create common validator with shared schemas
function createCommonValidator(schemas) {
  return {
    // Division validation (AP0_Div)
    validateDivision: ajv.compile({
      type: 'object',
      properties: {
        divisionCode: { type: 'string', format: 'varchar', maxLength: 10 },
        name: { type: 'string', format: 'varchar', maxLength: 100 },
        status: { type: 'string', enum: ['A', 'I'] },
        created_by: { type: 'string', format: 'varchar' },
        updated_by: { type: 'string', format: 'varchar' }
      },
      required: ['divisionCode', 'name', 'status']
    }),

    // Payment Terms validation (AP2_Term, AR2_Terms)
    validatePaymentTerms: ajv.compile({
      type: 'object',
      properties: {
        code: { type: 'string', format: 'varchar', maxLength: 10 },
        description: { type: 'string', format: 'varchar', maxLength: 100 },
        daysNet: { type: 'integer', minimum: 0 },
        discountDays: { type: 'integer', minimum: 0 },
        discountPercent: { type: 'string', format: 'decimal14_3' },
        divisionId: { type: 'string', format: 'uuid' },
        created_by: { type: 'string', format: 'varchar' },
        updated_by: { type: 'string', format: 'varchar' }
      },
      required: ['code', 'description', 'daysNet', 'divisionId']
    })
  };
}

// Get validator instance
export const getValidator = (type) => {
  if (!validators[type]) {
    throw new Error(`Validator type '${type}' not found`);
  }
  return validators[type];
};
