import { getValidator } from '../validators/index.js';
import { dbClient } from '../db/index.js';
import { logger } from '../utils/logger.js';
import Decimal from 'decimal.js';
import moment from 'moment-timezone';

class ValidationController {
  // AP Validations
  async validateAPVendor(req, res, next) {
    try {
      const { vendorData } = req.body;
      const validator = getValidator('ap');

      const valid = validator.validateVendor(vendorData);
      if (!valid) {
        return res.status(400).json({
          valid: false,
          errors: validator.validateVendor.errors
        });
      }

      // Additional business logic validation
      const errors = await this.validateAPVendorBusinessRules(vendorData);
      
      res.json({
        valid: errors.length === 0,
        errors
      });
    } catch (error) {
      logger.error('Error validating AP vendor:', error);
      next(error);
    }
  }

  async validateAPInvoice(req, res, next) {
    try {
      const { invoiceData } = req.body;
      const validator = getValidator('ap');

      const valid = validator.validateInvoice(invoiceData);
      if (!valid) {
        return res.status(400).json({
          valid: false,
          errors: validator.validateInvoice.errors
        });
      }

      // Additional business logic validation
      const errors = await this.validateAPInvoiceBusinessRules(invoiceData);

      res.json({
        valid: errors.length === 0,
        errors
      });
    } catch (error) {
      logger.error('Error validating AP invoice:', error);
      next(error);
    }
  }

  // AR Validations
  async validateARCustomer(req, res, next) {
    try {
      const { customerData } = req.body;
      const validator = getValidator('ar');

      const valid = validator.validateCustomer(customerData);
      if (!valid) {
        return res.status(400).json({
          valid: false,
          errors: validator.validateCustomer.errors
        });
      }

      // Additional business logic validation
      const errors = await this.validateARCustomerBusinessRules(customerData);

      res.json({
        valid: errors.length === 0,
        errors
      });
    } catch (error) {
      logger.error('Error validating AR customer:', error);
      next(error);
    }
  }

  async validateARInvoice(req, res, next) {
    try {
      const { invoiceData } = req.body;
      const validator = getValidator('ar');

      const valid = validator.validateInvoice(invoiceData);
      if (!valid) {
        return res.status(400).json({
          valid: false,
          errors: validator.validateInvoice.errors
        });
      }

      // Additional business logic validation
      const errors = await this.validateARInvoiceBusinessRules(invoiceData);

      res.json({
        valid: errors.length === 0,
        errors
      });
    } catch (error) {
      logger.error('Error validating AR invoice:', error);
      next(error);
    }
  }

  // Batch Validations
  async validateAPBatch(req, res, next) {
    try {
      const { batchData } = req.body;
      const results = {
        valid: true,
        items: []
      };

      for (const item of batchData) {
        const validator = getValidator('ap');
        const valid = validator.validateInvoice(item);
        
        results.items.push({
          identifier: item.invoiceNumber,
          valid: valid,
          errors: valid ? [] : validator.validateInvoice.errors
        });

        if (!valid) results.valid = false;
      }

      res.json(results);
    } catch (error) {
      logger.error('Error validating AP batch:', error);
      next(error);
    }
  }

  async validateARBatch(req, res, next) {
    try {
      const { batchData } = req.body;
      const results = {
        valid: true,
        items: []
      };

      for (const item of batchData) {
        const validator = getValidator('ar');
        const valid = validator.validateInvoice(item);
        
        results.items.push({
          identifier: item.invoiceNumber,
          valid: valid,
          errors: valid ? [] : validator.validateInvoice.errors
        });

        if (!valid) results.valid = false;
      }

      res.json(results);
    } catch (error) {
      logger.error('Error validating AR batch:', error);
      next(error);
    }
  }

  // Data Type Validations
  async validateDataType(req, res, next) {
    try {
      const { data, type } = req.body;
      let isValid = false;
      let error = null;

      switch (type) {
        case 'VARCHAR':
          isValid = typeof data === 'string';
          error = isValid ? null : 'Value must be a string';
          break;

        case 'DECIMAL':
          try {
            const decimal = new Decimal(data);
            // Validate precision (14) and scale (3)
            const parts = decimal.toFixed(3).split('.');
            isValid = parts[0].length <= 11 && (!parts[1] || parts[1].length <= 3);
            error = isValid ? null : 'Value must be a decimal with precision 14 and scale 3';
          } catch {
            error = 'Invalid decimal value';
          }
          break;

        case 'TIMESTAMP':
          isValid = moment(data, moment.ISO_8601, true).isValid();
          error = isValid ? null : 'Invalid timestamp format';
          break;

        case 'UUID':
          isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data);
          error = isValid ? null : 'Invalid UUID format';
          break;

        default:
          return res.status(400).json({
            valid: false,
            error: `Unsupported data type: ${type}`
          });
      }

      res.json({
        valid: isValid,
        error
      });
    } catch (error) {
      logger.error('Error validating data type:', error);
      next(error);
    }
  }

  // Schema Management
  async getValidationSchema(req, res, next) {
    try {
      const { module, entity } = req.params;
      const client = await dbClient.getClient();

      const { rows } = await client.query(`
        SELECT schema_definition
        FROM validation.schemas
        WHERE module = $1 AND entity = $2 AND active = true
      `, [module, entity]);

      if (rows.length === 0) {
        return res.status(404).json({
          message: 'Validation schema not found'
        });
      }

      res.json(JSON.parse(rows[0].schema_definition));
    } catch (error) {
      logger.error('Error getting validation schema:', error);
      next(error);
    }
  }

  async updateValidationSchema(req, res, next) {
    try {
      const { module, entity } = req.params;
      const { schemaDefinition } = req.body;
      const client = await dbClient.getClient();

      await client.query('BEGIN');

      // Deactivate current schema
      await client.query(`
        UPDATE validation.schemas
        SET active = false,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $1
        WHERE module = $2 AND entity = $3 AND active = true
      `, [req.user.id, module, entity]);

      // Insert new schema
      await client.query(`
        INSERT INTO validation.schemas (
          module, entity, schema_definition, active,
          created_by, updated_by
        ) VALUES ($1, $2, $3, true, $4, $4)
      `, [module, entity, JSON.stringify(schemaDefinition), req.user.id]);

      await client.query('COMMIT');

      res.json({
        message: 'Validation schema updated successfully'
      });
    } catch (error) {
      logger.error('Error updating validation schema:', error);
      next(error);
    }
  }

  // Business Rules Validation
  async validateAPVendorBusinessRules(vendorData) {
    const errors = [];
    const client = await dbClient.getClient();

    try {
      // Check if vendor code is unique within division
      const { rows } = await client.query(`
        SELECT id FROM accounts_payable.vendors
        WHERE vendor_code = $1 AND division_id = $2 AND id != $3
      `, [vendorData.vendorCode, vendorData.divisionId, vendorData.id || '']);

      if (rows.length > 0) {
        errors.push('Vendor code must be unique within division');
      }

      // Validate tax ID format if provided
      if (vendorData.taxId && !this.isValidTaxId(vendorData.taxId)) {
        errors.push('Invalid tax ID format');
      }

      // Validate payment terms if provided
      if (vendorData.paymentTerms) {
        const { rows } = await client.query(`
          SELECT id FROM accounts_payable.payment_terms
          WHERE code = $1 AND division_id = $2
        `, [vendorData.paymentTerms, vendorData.divisionId]);

        if (rows.length === 0) {
          errors.push('Invalid payment terms code');
        }
      }

      return errors;
    } finally {
      client.release();
    }
  }

  async validateAPInvoiceBusinessRules(invoiceData) {
    const errors = [];
    const client = await dbClient.getClient();

    try {
      // Check if invoice number is unique for vendor
      const { rows } = await client.query(`
        SELECT id FROM accounts_payable.invoices
        WHERE invoice_number = $1 AND vendor_id = $2 AND id != $3
      `, [invoiceData.invoiceNumber, invoiceData.vendorId, invoiceData.id || '']);

      if (rows.length > 0) {
        errors.push('Invoice number must be unique for vendor');
      }

      // Validate vendor exists and is active
      const vendorResult = await client.query(`
        SELECT status FROM accounts_payable.vendors
        WHERE id = $1
      `, [invoiceData.vendorId]);

      if (vendorResult.rows.length === 0) {
        errors.push('Vendor not found');
      } else if (vendorResult.rows[0].status !== 'A') {
        errors.push('Vendor is not active');
      }

      // Validate dates
      const invoiceDate = moment(invoiceData.invoiceDate);
      const dueDate = moment(invoiceData.dueDate);

      if (dueDate.isBefore(invoiceDate)) {
        errors.push('Due date cannot be before invoice date');
      }

      return errors;
    } finally {
      client.release();
    }
  }

  async validateARCustomerBusinessRules(customerData) {
    const errors = [];
    const client = await dbClient.getClient();

    try {
      // Check if customer code is unique within division
      const { rows } = await client.query(`
        SELECT id FROM accounts_receivable.customers
        WHERE customer_code = $1 AND division_id = $2 AND id != $3
      `, [customerData.customerCode, customerData.divisionId, customerData.id || '']);

      if (rows.length > 0) {
        errors.push('Customer code must be unique within division');
      }

      // Validate tax ID format if provided
      if (customerData.taxId && !this.isValidTaxId(customerData.taxId)) {
        errors.push('Invalid tax ID format');
      }

      // Validate credit limit
      if (customerData.creditLimit) {
        try {
          const limit = new Decimal(customerData.creditLimit);
          if (limit.isNegative()) {
            errors.push('Credit limit cannot be negative');
          }
        } catch {
          errors.push('Invalid credit limit value');
        }
      }

      return errors;
    } finally {
      client.release();
    }
  }

  async validateARInvoiceBusinessRules(invoiceData) {
    const errors = [];
    const client = await dbClient.getClient();

    try {
      // Check if invoice number is unique for customer
      const { rows } = await client.query(`
        SELECT id FROM accounts_receivable.invoices
        WHERE invoice_number = $1 AND customer_id = $2 AND id != $3
      `, [invoiceData.invoiceNumber, invoiceData.customerId, invoiceData.id || '']);

      if (rows.length > 0) {
        errors.push('Invoice number must be unique for customer');
      }

      // Validate customer exists and is active
      const customerResult = await client.query(`
        SELECT status, credit_limit FROM accounts_receivable.customers
        WHERE id = $1
      `, [invoiceData.customerId]);

      if (customerResult.rows.length === 0) {
        errors.push('Customer not found');
      } else if (customerResult.rows[0].status !== 'A') {
        errors.push('Customer is not active');
      }

      // Check credit limit
      if (customerResult.rows.length > 0 && customerResult.rows[0].credit_limit) {
        const creditLimit = new Decimal(customerResult.rows[0].credit_limit);
        const invoiceAmount = new Decimal(invoiceData.amount);

        // Get total outstanding balance
        const balanceResult = await client.query(`
          SELECT COALESCE(SUM(amount), 0) as total_balance
          FROM accounts_receivable.invoices
          WHERE customer_id = $1 AND status = 'A'
        `, [invoiceData.customerId]);

        const currentBalance = new Decimal(balanceResult.rows[0].total_balance);
        
        if (currentBalance.plus(invoiceAmount).greaterThan(creditLimit)) {
          errors.push('Invoice would exceed customer credit limit');
        }
      }

      return errors;
    } finally {
      client.release();
    }
  }

  isValidTaxId(taxId) {
    // Basic tax ID validation (can be enhanced based on requirements)
    return /^\d{2}-\d{7}$/.test(taxId);
  }
}

export const validationController = new ValidationController();
