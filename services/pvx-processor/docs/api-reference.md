# PVX Processor API Reference

## Overview

The PVX Processor service provides RESTful endpoints for processing legacy PVX files and converting them to modern PostgreSQL schemas. This document provides detailed information about each API endpoint, including request/response formats, authentication, and examples.

## Base URL

```
http://localhost:3003/api/v1
```

## Authentication

All API endpoints require authentication using a Bearer token:

```http
Authorization: Bearer <your_token>
```

## Endpoints

### Health Check

Check the service health status.

```http
GET /health
```

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-03-13T21:56:11Z"
}
```

### Process Single PVX File

Process a single PVX file and convert it to a modern PostgreSQL schema.

```http
POST /process
Content-Type: multipart/form-data
```

#### Request Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| file      | File   | Yes      | The PVX file to process (.pxprg) |
| options   | Object | No       | Processing options |

**Options Object:**

```json
{
  "validateOnly": false,
  "skipWarnings": false,
  "addAuditFields": true,
  "useUuidPrimaryKeys": true,
  "addForeignKeyConstraints": true,
  "enableRowLevelSecurity": true,
  "enableFullTextSearch": true,
  "logLevel": "info"
}
```

#### Response

```json
{
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  },
  "sql": "-- Generated SQL statements...",
  "tableName": "vendors",
  "processingTime": 1234,
  "warnings": []
}
```

### Process Multiple PVX Files

Process multiple PVX files in a batch operation.

```http
POST /process-batch
Content-Type: multipart/form-data
```

#### Request Parameters

| Parameter | Type     | Required | Description |
|-----------|----------|----------|-------------|
| files     | File[]   | Yes      | Array of PVX files |
| options   | Object   | No       | Processing options |

#### Response

```json
[
  {
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": []
    },
    "sql": "-- Generated SQL statements...",
    "tableName": "vendors",
    "processingTime": 1234,
    "warnings": []
  }
]
```

### AP Module Endpoints

#### Divisions (AP0_Div)

```http
GET /api/divisions
POST /api/divisions
PUT /api/divisions/:id
DELETE /api/divisions/:id
```

#### Payment Terms (AP2_Term)

```http
GET /api/payment-terms
POST /api/payment-terms
PUT /api/payment-terms/:id
DELETE /api/payment-terms/:id
```

#### Vendor Categories (AP3_VendCatg)

```http
GET /api/vendor-categories
POST /api/vendor-categories
PUT /api/vendor-categories/:id
DELETE /api/vendor-categories/:id
```

#### Vendors (AP4_Vend)

```http
GET /api/vendors
POST /api/vendors
PUT /api/vendors/:id
DELETE /api/vendors/:id
```

#### Vendor Status (AP5_VendStatus)

```http
GET /api/vendor-status
POST /api/vendor-status
PUT /api/vendor-status/:id
DELETE /api/vendor-status/:id
```

#### Vendor Messages (AP8_VendMsg)

```http
GET /api/vendor-messages
POST /api/vendor-messages
PUT /api/vendor-messages/:id
DELETE /api/vendor-messages/:id
```

#### Vendor Statistics (AP9_VendStats)

```http
GET /api/vendor-statistics
POST /api/vendor-statistics
PUT /api/vendor-statistics/:id
DELETE /api/vendor-statistics/:id
```

#### AP Invoices (APA_InvoiceEntManChk)

```http
GET /api/ap-invoices
POST /api/ap-invoices
PUT /api/ap-invoices/:id
DELETE /api/ap-invoices/:id
```

### AR Module Endpoints

#### Customers (AR1_Cust)

```http
GET /api/customers
POST /api/customers
PUT /api/customers/:id
DELETE /api/customers/:id
```

#### AR Terms (AR2_Terms)

```http
GET /api/ar-terms
POST /api/ar-terms
PUT /api/ar-terms/:id
DELETE /api/ar-terms/:id
```

#### Sales Tax (AR5_SlsTax)

```http
GET /api/sales-tax
POST /api/sales-tax
PUT /api/sales-tax/:id
DELETE /api/sales-tax/:id
```

#### Open Invoices (AR6_OpenInvoice)

```http
GET /api/open-invoices
POST /api/open-invoices
PUT /api/open-invoices/:id
DELETE /api/open-invoices/:id
```

#### Salesperson Statistics (ARA_SlspersonStats)

```http
GET /api/salesperson-stats
POST /api/salesperson-stats
PUT /api/salesperson-stats/:id
DELETE /api/salesperson-stats/:id
```

#### AR Invoices (ARB_InvoiceEntHdr)

```http
GET /api/ar-invoices
POST /api/ar-invoices
PUT /api/ar-invoices/:id
DELETE /api/ar-invoices/:id
```

### Validation Service

Validate PVX files without processing them.

```http
POST /api/validate
Content-Type: multipart/form-data
```

#### Request Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| file      | File   | Yes      | The PVX file to validate |
| type      | String | Yes      | Module type (AP or AR) |

#### Response

```json
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "details": {
    "moduleType": "AP4_Vend",
    "fieldCount": 15,
    "recordCount": 1234
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Window: 15 minutes
- Max requests per window: 100 requests per IP

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error context"
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | INVALID_REQUEST | Bad Request - Invalid parameters |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Internal server error |
| 502 | SERVICE_UNAVAILABLE | Upstream service unavailable |

## Examples

### cURL Examples

1. Process a single file:
```bash
curl -X POST http://localhost:3003/api/v1/process \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@/path/to/your/file.pxprg" \
  -F "options={\"validateOnly\":false}"
```

2. Process multiple files:
```bash
curl -X POST http://localhost:3003/api/v1/process-batch \
  -H "Authorization: Bearer <your_token>" \
  -F "files[]=@/path/to/file1.pxprg" \
  -F "files[]=@/path/to/file2.pxprg" \
  -F "options={\"validateOnly\":false}"
```

3. Validate a file:
```bash
curl -X POST http://localhost:3003/api/validate \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@/path/to/your/file.pxprg" \
  -F "type=AP4_Vend"
```

### JavaScript/TypeScript Example

```typescript
import axios from 'axios';
import FormData from 'form-data';

const processPVXFile = async (file: File, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify(options));

  try {
    const response = await axios.post(
      'http://localhost:3003/api/v1/process',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error processing PVX file:', error);
    throw error;
  }
};

// Example usage
const processVendorFile = async () => {
  const file = new File(['...'], 'AP4_VEND.pxprg');
  const options = {
    validateOnly: false,
    addAuditFields: true,
    useUuidPrimaryKeys: true,
    enableRowLevelSecurity: true
  };

  try {
    const result = await processPVXFile(file, options);
    console.log('Processing result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
