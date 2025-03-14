# PVX Processor Developer Guide

## Overview

The PVX Processor service is designed to modernize legacy PVX-based systems by converting them to a modern PostgreSQL database architecture. This guide provides detailed information about the PVX file format, migration process, and development guidelines.

## PVX File Format

### Structure
PVX files (`.pxprg`) are structured text files containing:
- Module definitions
- Field definitions
- Data type specifications
- Relationships between modules

### Example PVX File
```
* AP4_VEND - Vendor Master Data
FIELD VENDNO     CHAR(10)
FIELD NAME       CHAR(30)
FIELD ADDRESS1   CHAR(30)
FIELD CITY       CHAR(20)
FIELD STATE      CHAR(2)
FIELD ZIP        CHAR(10)
FIELD PHONE      CHAR(14)
FIELD BALANCE    NUMBER(14,3)
FIELD LASTPAY    DATE
```

## Database Components

### Accounts Payable (AP) Module
| Module | Description | Key Fields |
|--------|-------------|------------|
| AP0_Div | Division information | DIV_NO, DIV_NAME |
| AP2_Term | Payment terms | TERM_CODE, DESCRIPTION |
| AP3_VendCatg | Vendor categories | CATG_CODE, DESCRIPTION |
| AP4_Vend | Vendor master data | VEND_NO, NAME, ADDRESS |
| AP5_VendStatus | Vendor status and 1099 info | VEND_NO, STATUS_CODE |
| AP8_VendMsg | Vendor messages | VEND_NO, MSG_TEXT |
| AP9_VendStats | Vendor statistics | VEND_NO, YTD_PURCHASES |
| APA_InvoiceEntManChk | Invoice entry | INV_NO, VEND_NO, AMOUNT |

### Accounts Receivable (AR) Module
| Module | Description | Key Fields |
|--------|-------------|------------|
| AR1_Cust | Customer information | CUST_NO, NAME, ADDRESS |
| AR2_Terms | Payment terms | TERM_CODE, DESCRIPTION |
| AR5_SlsTax | Sales tax | TAX_CODE, RATE |
| AR6_OpenInvoice | Open invoices | INV_NO, CUST_NO, AMOUNT |
| ARA_SlspersonStats | Salesperson statistics | SLSP_NO, YTD_SALES |
| ARB_InvoiceEntHdr | Invoice entry header | INV_NO, CUST_NO, DATE |

## Migration Process

### 1. Schema Modernization
- **Data Type Mapping**
  ```sql
  -- Legacy format
  FIELD BALANCE NUMBER(14,3)
  
  -- Modern PostgreSQL
  balance DECIMAL(14,3)
  ```

- **Primary Keys**
  ```sql
  -- Modern format with UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id VARCHAR(10)  -- Store original ID for reference
  ```

- **Audit Fields**
  ```sql
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
  ```

### 2. Modern Features Implementation

#### Row-Level Security
```sql
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendors_policy ON vendors
  USING (created_by = current_user_id());
```

#### Full-Text Search
```sql
-- Add search vector column
ALTER TABLE vendors 
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(address1, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(state, '')
    )
  ) STORED;

-- Create search index
CREATE INDEX vendors_search_idx ON vendors USING GIN (search_vector);
```

#### Audit Triggers
```sql
CREATE OR REPLACE FUNCTION update_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = current_user_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_audit_trigger
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_fields();
```

## Development Guidelines

### 1. Code Organization
```
src/
├── converters/      # Data conversion logic
├── services/        # Business logic
├── types/          # TypeScript definitions
├── utils/          # Shared utilities
└── validators/     # Validation logic
```

### 2. Error Handling
```typescript
try {
  // Attempt operation
  const result = await processor.processFile(filePath);
  return result;
} catch (error) {
  // Log error with context
  logger.error(`Error processing file ${filePath}:`, {
    error,
    context: {
      fileName: path.basename(filePath),
      fileSize: fs.statSync(filePath).size
    }
  });
  throw error;
}
```

### 3. Validation Rules
- Field length constraints
- Required fields
- Data type validation
- Business logic validation
- Relationship validation

### 4. Testing Strategy

#### Unit Tests
```typescript
describe('PVX Validator', () => {
  it('should validate vendor fields correctly', async () => {
    const content = `
      FIELD VENDNO CHAR(10)
      FIELD NAME CHAR(30)
    `;
    const result = await validatePVX(content, APModuleType.AP4_VEND);
    expect(result.isValid).toBe(true);
  });
});
```

#### Integration Tests
```typescript
describe('PVX Processor Integration', () => {
  it('should process vendor file end-to-end', async () => {
    const filePath = path.join(__dirname, 'fixtures/AP4_VEND.pxprg');
    const processor = new PVXProcessor();
    const result = await processor.processFile(filePath);
    
    expect(result.validation.isValid).toBe(true);
    expect(result.sql).toContain('CREATE TABLE vendors');
  });
});
```

## Performance Considerations

1. **Batch Processing**
   - Use `processFiles` for multiple files
   - Implement concurrent processing with limits

2. **Memory Management**
   - Stream large files instead of loading entirely
   - Clean up temporary files after processing

3. **Database Optimization**
   - Create appropriate indexes
   - Use partitioning for large tables
   - Implement efficient search vectors

## Troubleshooting

### Common Issues

1. **Invalid File Format**
   ```
   Error: Invalid PVX format at line 5
   Solution: Verify file format matches module specification
   ```

2. **Data Type Mismatch**
   ```
   Error: Cannot convert CHAR(50) to VARCHAR(30)
   Solution: Adjust target field length or truncate data
   ```

3. **Missing Required Fields**
   ```
   Error: Required field 'VENDNO' not found
   Solution: Ensure all required fields are present
   ```

### Debugging Tips

1. Enable debug logging:
   ```typescript
   const processor = new PVXProcessor({
     logLevel: 'debug'
   });
   ```

2. Check validation warnings:
   ```typescript
   const result = await processor.processFile(filePath);
   if (result.warnings.length > 0) {
     logger.warn('Processing completed with warnings:', result.warnings);
   }
   ```

3. Monitor performance:
   ```typescript
   const timer = performanceLogger.start('Processing file');
   // ... processing ...
   const duration = timer.end();
   logger.info(`Processing completed in ${duration}ms`);
   ```
