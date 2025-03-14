import { getProcessor } from '../processors/index.js';
import { dbClient } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { DocumentValidator } from '../processors/validation/documentValidator.js';

class DocumentController {
  constructor() {
    this.validator = new DocumentValidator();
  }

  // AP Invoice Processing
  async uploadAPInvoice(req, res, next) {
    try {
      const { divisionId } = req.body;
      const file = req.file;

      // Validate file
      this.validator.validateFileFormat(file.originalname, ['pdf', 'xlsx', 'xml']);
      this.validator.validateFileSize(file.size);

      // Get appropriate processor
      const processor = getProcessor('ap');

      // Process file based on format
      const format = file.originalname.split('.').pop().toLowerCase();
      const invoiceData = await processor.processInvoiceFile(file.buffer, format);

      // Process invoice
      const result = await processor.processInvoice({
        ...invoiceData,
        divisionId,
        userId: req.user.id
      }, divisionId);

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error uploading AP invoice:', error);
      next(error);
    }
  }

  // AR Invoice Processing
  async uploadARInvoice(req, res, next) {
    try {
      const { divisionId } = req.body;
      const file = req.file;

      // Validate file
      this.validator.validateFileFormat(file.originalname, ['pdf', 'xlsx', 'xml']);
      this.validator.validateFileSize(file.size);

      // Get appropriate processor
      const processor = getProcessor('ar');

      // Process file based on format
      const format = file.originalname.split('.').pop().toLowerCase();
      const invoiceData = await processor.processInvoiceFile(file.buffer, format);

      // Process invoice
      const result = await processor.processInvoice({
        ...invoiceData,
        divisionId,
        userId: req.user.id
      }, divisionId);

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error uploading AR invoice:', error);
      next(error);
    }
  }

  // AP Batch Processing
  async uploadAPBatch(req, res, next) {
    try {
      const { divisionId } = req.body;
      const files = req.files;

      // Start batch processing
      const processId = Date.now().toString();
      const processor = getProcessor('ap');

      // Process files asynchronously
      this.processBatch(processId, files, processor, divisionId, req.user.id);

      res.status(202).json({
        message: 'Batch processing started',
        processId
      });
    } catch (error) {
      logger.error('Error uploading AP batch:', error);
      next(error);
    }
  }

  // AR Batch Processing
  async uploadARBatch(req, res, next) {
    try {
      const { divisionId } = req.body;
      const files = req.files;

      // Start batch processing
      const processId = Date.now().toString();
      const processor = getProcessor('ar');

      // Process files asynchronously
      this.processBatch(processId, files, processor, divisionId, req.user.id);

      res.status(202).json({
        message: 'Batch processing started',
        processId
      });
    } catch (error) {
      logger.error('Error uploading AR batch:', error);
      next(error);
    }
  }

  // Batch Processing Helper
  async processBatch(processId, files, processor, divisionId, userId) {
    const client = await dbClient.getClient();
    try {
      await client.query('BEGIN');

      // Create batch process record
      await client.query(`
        INSERT INTO document_processing.batch_processes (
          id, total_files, processed_files, status, created_by
        ) VALUES ($1, $2, 0, 'processing', $3)
      `, [processId, files.length, userId]);

      await client.query('COMMIT');

      // Process each file
      for (const file of files) {
        try {
          const format = file.originalname.split('.').pop().toLowerCase();
          const invoiceData = await processor.processInvoiceFile(file.buffer, format);
          
          await processor.processInvoice({
            ...invoiceData,
            divisionId,
            userId
          }, divisionId);

          // Update progress
          await this.updateBatchProgress(processId, 1);
        } catch (error) {
          logger.error(`Error processing file ${file.originalname}:`, error);
          await this.logBatchError(processId, file.originalname, error.message);
        }
      }

      // Mark batch as complete
      await this.completeBatchProcess(processId);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error in batch processing:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Batch Progress Updates
  async updateBatchProgress(processId, increment) {
    const client = await dbClient.getClient();
    try {
      await client.query(`
        UPDATE document_processing.batch_processes
        SET processed_files = processed_files + $1
        WHERE id = $2
      `, [increment, processId]);
    } finally {
      client.release();
    }
  }

  async logBatchError(processId, filename, error) {
    const client = await dbClient.getClient();
    try {
      await client.query(`
        INSERT INTO document_processing.batch_errors (
          batch_id, filename, error_message
        ) VALUES ($1, $2, $3)
      `, [processId, filename, error]);
    } finally {
      client.release();
    }
  }

  async completeBatchProcess(processId) {
    const client = await dbClient.getClient();
    try {
      await client.query(`
        UPDATE document_processing.batch_processes
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [processId]);
    } finally {
      client.release();
    }
  }

  // Get Process Status
  async getProcessStatus(req, res, next) {
    try {
      const { processId } = req.params;
      const client = await dbClient.getClient();

      const { rows } = await client.query(`
        SELECT bp.*, 
          (SELECT json_agg(be.*) 
           FROM document_processing.batch_errors be 
           WHERE be.batch_id = bp.id) as errors
        FROM document_processing.batch_processes bp
        WHERE bp.id = $1
      `, [processId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Process not found' });
      }

      res.json(rows[0]);
    } catch (error) {
      logger.error('Error getting process status:', error);
      next(error);
    }
  }

  // Document Search
  async searchDocuments(req, res, next) {
    try {
      const { type, query, divisionId, startDate, endDate } = req.query;
      const client = await dbClient.getClient();

      let sql;
      const params = [divisionId];
      let paramCount = 1;

      if (type === 'AP') {
        sql = `
          SELECT i.*, v.vendor_code, v.name as vendor_name
          FROM accounts_payable.invoices i
          JOIN accounts_payable.vendors v ON i.vendor_id = v.id
          WHERE i.division_id = $1
        `;
      } else {
        sql = `
          SELECT i.*, c.customer_code, c.name as customer_name
          FROM accounts_receivable.invoices i
          JOIN accounts_receivable.customers c ON i.customer_id = c.id
          WHERE i.division_id = $1
        `;
      }

      if (startDate) {
        paramCount++;
        sql += ` AND i.invoice_date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        sql += ` AND i.invoice_date <= $${paramCount}`;
        params.push(endDate);
      }

      if (query) {
        paramCount++;
        sql += ` AND (
          i.invoice_number ILIKE $${paramCount} OR
          ${type === 'AP' ? 'v.vendor_code' : 'c.customer_code'} ILIKE $${paramCount} OR
          ${type === 'AP' ? 'v.name' : 'c.name'} ILIKE $${paramCount}
        )`;
        params.push(`%${query}%`);
      }

      sql += ' ORDER BY i.invoice_date DESC LIMIT 100';

      const { rows } = await client.query(sql, params);
      res.json(rows);
    } catch (error) {
      logger.error('Error searching documents:', error);
      next(error);
    }
  }

  // Document Export
  async exportDocuments(req, res, next) {
    try {
      const { type, format, ids } = req.body;
      const processor = getProcessor(type.toLowerCase());

      // Start export process
      const processId = Date.now().toString();
      
      // Process export asynchronously
      this.processExport(processId, type, format, ids, req.user.id);

      res.status(202).json({
        message: 'Export processing started',
        processId
      });
    } catch (error) {
      logger.error('Error starting document export:', error);
      next(error);
    }
  }

  async processExport(processId, type, format, ids, userId) {
    const client = await dbClient.getClient();
    try {
      // Create export process record
      await client.query(`
        INSERT INTO document_processing.export_processes (
          id, type, format, total_documents, status, created_by
        ) VALUES ($1, $2, $3, $4, 'processing', $5)
      `, [processId, type, format, ids.length, userId]);

      // Process each document
      for (const id of ids) {
        try {
          // Get document data
          const { rows } = await client.query(`
            SELECT * FROM ${type === 'AP' ? 'accounts_payable' : 'accounts_receivable'}.invoices
            WHERE id = $1
          `, [id]);

          if (rows.length > 0) {
            // Convert document to requested format
            // Implementation depends on format (PDF, Excel, etc.)
            await this.convertAndStoreDocument(rows[0], format, processId);
          }
        } catch (error) {
          logger.error(`Error exporting document ${id}:`, error);
          await this.logExportError(processId, id, error.message);
        }
      }

      // Mark export as complete
      await client.query(`
        UPDATE document_processing.export_processes
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [processId]);
    } catch (error) {
      logger.error('Error in export processing:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async convertAndStoreDocument(document, format, processId) {
    // Implementation for document conversion and storage
    // This would handle different output formats (PDF, Excel, etc.)
    // and store the converted files for later retrieval
  }

  async logExportError(processId, documentId, error) {
    const client = await dbClient.getClient();
    try {
      await client.query(`
        INSERT INTO document_processing.export_errors (
          export_id, document_id, error_message
        ) VALUES ($1, $2, $3)
      `, [processId, documentId, error]);
    } finally {
      client.release();
    }
  }
}

export const documentController = new DocumentController();
