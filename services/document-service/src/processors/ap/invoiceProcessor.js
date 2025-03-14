import { dbClient } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { FileConverter } from '../conversion/fileConverter.js';
import { DocumentValidator } from '../validation/documentValidator.js';

export class APInvoiceProcessor {
  constructor() {
    this.converter = new FileConverter();
    this.validator = new DocumentValidator();
  }

  async initialize() {
    logger.info('Initializing AP Invoice Processor');
    // Initialize any required resources
  }

  async processInvoice(invoiceData, divisionId) {
    const client = await dbClient.getClient();
    try {
      await client.query('BEGIN');

      // Validate vendor exists
      const vendor = await this.validateVendor(client, invoiceData.vendorCode, divisionId);
      if (!vendor) {
        throw new Error(`Vendor ${invoiceData.vendorCode} not found in division ${divisionId}`);
      }

      // Process and store invoice
      const invoiceId = await this.createInvoice(client, {
        ...invoiceData,
        vendorId: vendor.id,
        divisionId
      });

      // Process invoice items
      await this.processInvoiceItems(client, invoiceId, invoiceData.items);

      // Update vendor statistics
      await this.updateVendorStatistics(client, vendor.id, invoiceData.totalAmount);

      await client.query('COMMIT');
      logger.info(`Successfully processed AP invoice for vendor ${invoiceData.vendorCode}`);

      return { invoiceId, status: 'success' };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error processing AP invoice:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async validateVendor(client, vendorCode, divisionId) {
    const { rows } = await client.query(`
      SELECT id, name, status
      FROM accounts_payable.vendors
      WHERE vendor_code = $1 AND division_id = $2
    `, [vendorCode, divisionId]);

    if (rows.length === 0) {
      return null;
    }

    const vendor = rows[0];
    if (vendor.status !== 'A') {
      throw new Error(`Vendor ${vendorCode} is not active`);
    }

    return vendor;
  }

  async createInvoice(client, data) {
    const { rows } = await client.query(`
      INSERT INTO accounts_payable.invoices (
        vendor_id,
        division_id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        status,
        currency_code,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
      RETURNING id
    `, [
      data.vendorId,
      data.divisionId,
      data.invoiceNumber,
      data.invoiceDate,
      data.dueDate,
      data.totalAmount,
      'P', // Pending
      data.currencyCode || 'USD',
      data.userId
    ]);

    return rows[0].id;
  }

  async processInvoiceItems(client, invoiceId, items) {
    for (const item of items) {
      await client.query(`
        INSERT INTO accounts_payable.invoice_items (
          invoice_id,
          line_number,
          description,
          quantity,
          unit_price,
          amount,
          created_by,
          updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      `, [
        invoiceId,
        item.lineNumber,
        item.description,
        item.quantity,
        item.unitPrice,
        item.quantity * item.unitPrice,
        item.userId
      ]);
    }
  }

  async updateVendorStatistics(client, vendorId, amount) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Update or create vendor statistics
    await client.query(`
      INSERT INTO accounts_payable.vendor_statistics (
        vendor_id,
        year,
        month,
        invoice_count,
        total_amount,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, 1, $4, 'system', 'system')
      ON CONFLICT (vendor_id, year, month)
      DO UPDATE SET
        invoice_count = vendor_statistics.invoice_count + 1,
        total_amount = vendor_statistics.total_amount + $4,
        updated_at = CURRENT_TIMESTAMP
    `, [vendorId, year, month, amount]);
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
      await this.validator.validateInvoiceData(invoiceData);

      return invoiceData;
    } catch (error) {
      logger.error('Error processing invoice file:', error);
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
