import { convertToSQL } from '../../converters/sqlConverter';
import { SQLConversionOptions } from '../../types';

describe('SQL Converter Tests', () => {
  describe('Data Type Mapping', () => {
    it('should convert CHAR to VARCHAR', async () => {
      const content = `
HEADER
  PROGRAM=TEST
  VERSION=1.0
END_HEADER

FIELD TEST_FIELD CHAR(50)

END
`;
      const result = await convertToSQL(content, 'TEST');
      expect(result).toContain('test_field VARCHAR(50)');
    });

    it('should convert NUMBER to DECIMAL', async () => {
      const content = `
HEADER
  PROGRAM=TEST
  VERSION=1.0
END_HEADER

FIELD AMOUNT NUMBER(14,3)

END
`;
      const result = await convertToSQL(content, 'TEST');
      expect(result).toContain('amount DECIMAL(14,3)');
    });

    it('should convert DATE to TIMESTAMP WITH TIME ZONE', async () => {
      const content = `
HEADER
  PROGRAM=TEST
  VERSION=1.0
END_HEADER

FIELD EVENT_DATE DATE

END
`;
      const result = await convertToSQL(content, 'TEST');
      expect(result).toContain('event_date TIMESTAMP WITH TIME ZONE');
    });
  });

  describe('Modern PostgreSQL Features', () => {
    const content = `
HEADER
  PROGRAM=TEST
  VERSION=1.0
END_HEADER

FIELD CODE CHAR(10)
FIELD NAME CHAR(100)
FIELD AMOUNT NUMBER(14,3)

END
`;

    it('should add UUID primary key', async () => {
      const options: SQLConversionOptions = {
        useUuidPrimaryKeys: true
      };
      const result = await convertToSQL(content, 'TEST', options);
      expect(result).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    });

    it('should add audit fields', async () => {
      const options: SQLConversionOptions = {
        addAuditFields: true
      };
      const result = await convertToSQL(content, 'TEST', options);
      expect(result).toContain('created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
      expect(result).toContain('updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
      expect(result).toContain('created_by UUID REFERENCES users(id)');
      expect(result).toContain('updated_by UUID REFERENCES users(id)');
    });

    it('should add row-level security', async () => {
      const options: SQLConversionOptions = {
        enableRowLevelSecurity: true
      };
      const result = await convertToSQL(content, 'TEST', options);
      expect(result).toContain('ALTER TABLE test ENABLE ROW LEVEL SECURITY');
      expect(result).toContain('CREATE POLICY');
    });

    it('should add full-text search', async () => {
      const options: SQLConversionOptions = {
        enableFullTextSearch: true
      };
      const result = await convertToSQL(content, 'TEST', options);
      expect(result).toContain('search_vector tsvector');
      expect(result).toContain('CREATE INDEX test_search_idx');
      expect(result).toContain('USING GIN (search_vector)');
    });

    it('should combine all modern features', async () => {
      const options: SQLConversionOptions = {
        useUuidPrimaryKeys: true,
        addAuditFields: true,
        enableRowLevelSecurity: true,
        enableFullTextSearch: true,
        addForeignKeyConstraints: true
      };
      const result = await convertToSQL(content, 'TEST', options);

      // Check for UUID primary key
      expect(result).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');

      // Check for audit fields
      expect(result).toContain('created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
      expect(result).toContain('updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');

      // Check for row-level security
      expect(result).toContain('ALTER TABLE test ENABLE ROW LEVEL SECURITY');
      expect(result).toContain('CREATE POLICY "test_view_policy"');

      // Check for full-text search
      expect(result).toContain('search_vector tsvector');
      expect(result).toContain('CREATE INDEX test_search_idx');

      // Check for audit triggers
      expect(result).toContain('CREATE OR REPLACE FUNCTION test_audit_trigger()');
      expect(result).toContain('CREATE TRIGGER test_audit_trigger');
    });
  });

  describe('Module-Specific Tests', () => {
    it('should handle AP module schema correctly', async () => {
      const content = `
HEADER
  PROGRAM=AP4VEND
  VERSION=1.0
END_HEADER

FIELD VEND_CODE CHAR(20)
FIELD VEND_NAME CHAR(100)
FIELD ADDRESS1 CHAR(100)
FIELD CITY CHAR(50)
FIELD STATE CHAR(2)
FIELD ZIP_CODE CHAR(10)
FIELD TAX_ID CHAR(20)
FIELD TERM_CODE CHAR(10)

END
`;
      const result = await convertToSQL(content, 'AP4_VEND');

      // Check for proper table name
      expect(result).toContain('CREATE TABLE ap4_vend');

      // Check for vendor-specific fields
      expect(result).toContain('vend_code VARCHAR(20)');
      expect(result).toContain('vend_name VARCHAR(100)');

      // Check for foreign key to terms table
      expect(result).toContain('FOREIGN KEY (term_code) REFERENCES ap2_term(term_code)');

      // Check for full-text search on name and address
      expect(result).toContain('to_tsvector(\'english\', coalesce(vend_name, \'\') || \' \' || coalesce(address1, \'\'))');
    });

    it('should handle AR module schema correctly', async () => {
      const content = `
HEADER
  PROGRAM=AR1CUST
  VERSION=1.0
END_HEADER

FIELD CUST_CODE CHAR(20)
FIELD CUST_NAME CHAR(100)
FIELD ADDRESS1 CHAR(100)
FIELD CITY CHAR(50)
FIELD STATE CHAR(2)
FIELD ZIP_CODE CHAR(10)
FIELD CREDIT_LIMIT NUMBER(14,3)

END
`;
      const result = await convertToSQL(content, 'AR1_CUST');

      // Check for proper table name
      expect(result).toContain('CREATE TABLE ar1_cust');

      // Check for customer-specific fields
      expect(result).toContain('cust_code VARCHAR(20)');
      expect(result).toContain('cust_name VARCHAR(100)');
      expect(result).toContain('credit_limit DECIMAL(14,3)');

      // Check for full-text search on name and address
      expect(result).toContain('to_tsvector(\'english\', coalesce(cust_name, \'\') || \' \' || coalesce(address1, \'\'))');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file content', async () => {
      const content = 'INVALID CONTENT';
      await expect(convertToSQL(content, 'TEST')).rejects.toThrow();
    });

    it('should handle unsupported data types', async () => {
      const content = `
HEADER
  PROGRAM=TEST
  VERSION=1.0
END_HEADER

FIELD TEST_FIELD UNSUPPORTED_TYPE

END
`;
      await expect(convertToSQL(content, 'TEST')).rejects.toThrow();
    });

    it('should handle missing field definitions', async () => {
      const content = `
HEADER
  PROGRAM=TEST
  VERSION=1.0
END_HEADER

END
`;
      const result = await convertToSQL(content, 'TEST');
      expect(result).toContain('-- Warning: No field definitions found');
    });
  });
});
