import { PDFDocument } from 'pdf-lib';
import XLSX from 'xlsx';
import StreamZip from 'node-stream-zip';
import sharp from 'sharp';
import { logger } from '../../utils/logger.js';

export class FileConverter {
  async initialize() {
    logger.info('Initializing File Converter');
  }

  // PDF Processing (replacing tf2g functionality)
  async extractFromPDF(buffer) {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      let text = '';

      // Extract text from all pages
      for (const page of pages) {
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ');
      }

      // Parse the extracted text into structured data
      return this.parseDocumentText(text);
    } catch (error) {
      logger.error('Error extracting data from PDF:', error);
      throw new Error('Failed to process PDF document');
    }
  }

  // Excel Processing (replacing tf2w functionality)
  async extractFromExcel(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);

      return this.transformExcelData(data);
    } catch (error) {
      logger.error('Error extracting data from Excel:', error);
      throw new Error('Failed to process Excel document');
    }
  }

  // XML Processing (replacing tf2z functionality)
  async extractFromXML(buffer) {
    try {
      const xml = buffer.toString('utf-8');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');

      return this.parseXMLDocument(xmlDoc);
    } catch (error) {
      logger.error('Error extracting data from XML:', error);
      throw new Error('Failed to process XML document');
    }
  }

  // Image Processing
  async processImage(buffer, options = {}) {
    try {
      const image = sharp(buffer);
      
      // Apply OCR preprocessing
      await image
        .greyscale()
        .normalize()
        .sharpen();

      if (options.format) {
        image.toFormat(options.format);
      }

      if (options.resize) {
        image.resize(options.resize.width, options.resize.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      return await image.toBuffer();
    } catch (error) {
      logger.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  // Archive Processing
  async extractFromZip(buffer) {
    const tempPath = `/tmp/${Date.now()}.zip`;
    await fs.writeFile(tempPath, buffer);

    const zip = new StreamZip.async({ file: tempPath });
    const entries = await zip.entries();
    
    const results = [];
    for (const entry of Object.values(entries)) {
      if (entry.isDirectory) continue;

      const content = await zip.entryData(entry.name);
      const extension = entry.name.split('.').pop().toLowerCase();

      let data;
      switch (extension) {
        case 'pdf':
          data = await this.extractFromPDF(content);
          break;
        case 'xlsx':
        case 'xls':
          data = await this.extractFromExcel(content);
          break;
        case 'xml':
          data = await this.extractFromXML(content);
          break;
      }

      if (data) {
        results.push({
          filename: entry.name,
          data
        });
      }
    }

    await zip.close();
    await fs.unlink(tempPath);

    return results;
  }

  // Helper methods for parsing different document formats
  parseDocumentText(text) {
    // Implement intelligent text parsing logic here
    // This would replace the legacy PVX text parsing functionality
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    const data = {
      items: []
    };

    for (const line of lines) {
      // Look for invoice number
      if (line.match(/inv(oice)?\s*#?\s*:\s*(\d+)/i)) {
        data.invoiceNumber = line.match(/inv(oice)?\s*#?\s*:\s*(\d+)/i)[2];
      }
      
      // Look for dates
      if (line.match(/date\s*:\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i)) {
        data.invoiceDate = line.match(/date\s*:\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i)[1];
      }

      // Look for amounts
      if (line.match(/total\s*:\s*[\$]?\s*([\d,]+\.?\d*)/i)) {
        data.totalAmount = parseFloat(line.match(/total\s*:\s*[\$]?\s*([\d,]+\.?\d*)/i)[1].replace(',', ''));
      }

      // Look for line items
      const itemMatch = line.match(/(\d+)\s+(.+?)\s+([\d.]+)\s+([\d.]+)/);
      if (itemMatch) {
        data.items.push({
          lineNumber: parseInt(itemMatch[1]),
          description: itemMatch[2].trim(),
          quantity: parseFloat(itemMatch[3]),
          unitPrice: parseFloat(itemMatch[4])
        });
      }
    }

    return data;
  }

  transformExcelData(data) {
    // Transform Excel data into our standard format
    const invoice = {
      items: []
    };

    // Assuming first row contains headers
    const headerRow = data[0];
    
    // Map Excel columns to our data structure
    for (const row of data.slice(1)) {
      if (row['Invoice Number']) {
        invoice.invoiceNumber = row['Invoice Number'];
      }
      if (row['Invoice Date']) {
        invoice.invoiceDate = row['Invoice Date'];
      }
      if (row['Total Amount']) {
        invoice.totalAmount = parseFloat(row['Total Amount']);
      }

      // Process line items
      if (row['Line Number']) {
        invoice.items.push({
          lineNumber: parseInt(row['Line Number']),
          description: row['Description'],
          quantity: parseFloat(row['Quantity']),
          unitPrice: parseFloat(row['Unit Price'])
        });
      }
    }

    return invoice;
  }

  parseXMLDocument(xmlDoc) {
    // Parse XML structure into our standard format
    const invoice = {
      items: []
    };

    // Extract basic invoice data
    const invoiceNode = xmlDoc.getElementsByTagName('Invoice')[0];
    if (invoiceNode) {
      invoice.invoiceNumber = this.getXMLValue(invoiceNode, 'InvoiceNumber');
      invoice.invoiceDate = this.getXMLValue(invoiceNode, 'InvoiceDate');
      invoice.totalAmount = parseFloat(this.getXMLValue(invoiceNode, 'TotalAmount'));
    }

    // Extract line items
    const items = xmlDoc.getElementsByTagName('LineItem');
    for (const item of items) {
      invoice.items.push({
        lineNumber: parseInt(this.getXMLValue(item, 'LineNumber')),
        description: this.getXMLValue(item, 'Description'),
        quantity: parseFloat(this.getXMLValue(item, 'Quantity')),
        unitPrice: parseFloat(this.getXMLValue(item, 'UnitPrice'))
      });
    }

    return invoice;
  }

  getXMLValue(node, tagName) {
    const element = node.getElementsByTagName(tagName)[0];
    return element ? element.textContent : null;
  }
}
