import { dbClient } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { FileConverter } from '../conversion/fileConverter.js';
import { DocumentValidator } from '../validation/documentValidator.js';

export class ARInvoiceProcessor {
  constructor() {
    this.converter = new FileConverter();
    this.validator = new DocumentValidator();
  }

  async initialize() {
    logger.info('Initializing AR Invoice Processor');
    // Initialize any required resources
  }

  async processInvoice(invoiceData, divisionId) {
    const client = await dbClient.getClient();
    try {
      await client.query('BEGIN');

      // Validate customer exists
      const customer = await this.validateCustomer(client, invoiceData.customerCode, divisionId);
      if (!customer) {
        throw new Error(`Customer ${invoiceData.customerCode} not found in division ${divisionId}`);
      }

      // Validate sales tax
      const salesTax = await this.validateSalesTax(client, invoiceData.salesTaxCode, divisionId);

      // Process and store invoice
      const invoiceId = await this.createInvoice(client, {
        ...invoiceData,
        customerId: customer.id,
        salesTaxId: salesTax?.id,
        divisionId
      });

      // Process invoice items
      await this.processInvoiceItems(client, invoiceId, invoiceData.items);

      // Update customer statistics
      await this.updateCustomerStatistics(client, customer.id, invoiceData.totalAmount);

      await client.query('COMMIT');
      logger.info(`Successfully processed AR invoice for customer ${invoiceData.customerCode}`);

      return { invoiceId, status: 'success' };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error processing AR invoice:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async validateCustomer(client, customerCode, divisionId) {
    const { rows } = await client.query(`
      SELECT c.id, c.name, c.status, t.payment_terms
      FROM accounts_receivable.customers c
      LEFT JOIN accounts_receivable.payment_terms t ON c.payment_terms_id = t.id
      WHERE c.customer_code = $1 AND c.division_id = $2
    `, [customerCode, divisionId]);

    if (rows.length === 0) {
      return null;
    }

    const customer = rows[0];
    if (customer.status !== 'A') {
      throw new Error(`Customer ${customerCode} is not active`);
    }

    return customer;
  }

  async validateSalesTax(client, salesTaxCode, divisionId) {
    if (!salesTaxCode) return null;

    const { rows } = await client.query(`
      SELECT id, tax_rate
      FROM accounts_receivable.sales_tax
      WHERE tax_code = $1 AND division_id = $2 AND status = 'A'
    `, [salesTaxCode, divisionId]);

    if (rows.length === 0) {
      throw new Error(`Sales tax code ${salesTaxCode} not found or inactive`);
    }

    return rows[0];
  }

  async createInvoice(client, data) {
    // Calculate due date based on customer payment terms
    const dueDate = this.calculateDueDate(data.invoiceDate, data.paymentTerms);

    const { rows } = await client.query(`
      INSERT INTO accounts_receivable.invoices (
        customer_id,
        division_id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        sales_tax_id,
        tax_amount,
        status,
        currency_code,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
      RETURNING id
    `, [
      data.customerId,
      data.divisionId,
      data.invoiceNumber,
      data.invoiceDate,
      dueDate,
      data.totalAmount,
      data.salesTaxId,
      data.taxAmount || 0,
      'P', // Pending
      data.currencyCode || 'USD',
      data.userId
    ]);

    return rows[0].id;
  }

  async processInvoiceItems(client, invoiceId, items) {
    for (const item of items) {
      await client.query(`
        INSERT INTO accounts_receivable.invoice_items (
          invoice_id,
          line_number,
          description,
          quantity,
          unit_price,
          amount,
          tax_amount,
          created_by,
          updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      `, [
        invoiceId,
        item.lineNumber,
        item.description,
        item.quantity,
        item.unitPrice,
        item.quantity * item.unitPrice,
        item.taxAmount || 0,
        item.userId
      ]);
    }
  }

  async updateCustomerStatistics(client, customerId, amount) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Update or create customer statistics
    await client.query(`
      INSERT INTO accounts_receivable.customer_statistics (
        customer_id,
        year,
        month,
        invoice_count,
        total_amount,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, 1, $4, 'system', 'system')
      ON CONFLICT (customer_id, year, month)
      DO UPDATE SET
        invoice_count = customer_statistics.invoice_count + 1,
        total_amount = customer_statistics.total_amount + $4,
        updated_at = CURRENT_TIMESTAMP
    `, [customerId, year, month, amount]);
  }

  calculateDueDate(invoiceDate, paymentTerms) {
    const date = new Date(invoiceDate);
    if (!paymentTerms) {
      return date; // Due immediately if no terms
    }

    // Parse payment terms (e.g., "NET30" -> 30 days)
    const daysMatch = paymentTerms.match(/NET(\d+)/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      date.setDate(date.getDate() + days);
    }

    return date;
  }

  // Methods for handling different file formats (replacing PVX functionality)
  async processInvoiceFile(file, format) {
    try {
      let invoiceData;
      
      switch (format.toLowerCase()) {
        case 'pdf':
          invoiceData = await this.converter.extractFromPDF(file);
          break;
        case 'excel':
          invoiceData = await this.converter.extractFromExcel(file);
          break;
        case 'xml':
          invoiceData = await this.converter.extractFromXML(file);
          break;
        default:
          throw new Error(`Unsupported file format: ${format}`);
      }

      // Validate extracted data
      await this.validator.validateInvoiceData(invoiceData, 'AR');

      return invoiceData;
    } catch (error) {
      logger.error('Error processing AR invoice file:', error);
      throw error;
    }
  }

  // Batch processing capability (similar to PVX batch processing)
  async processBatch(batchData) {
    const results = {
      successful: [],
      failed: []
    };

    for (const invoice of batchData.invoices) {
      try {
        const result = await this.processInvoice(invoice, batchData.divisionId);
        results.successful.push({
          invoiceNumber: invoice.invoiceNumber,
          result
        });
      } catch (error) {
        results.failed.push({
          invoiceNumber: invoice.invoiceNumber,
          error: error.message
        });
      }
    }

    return results;
  }
}
