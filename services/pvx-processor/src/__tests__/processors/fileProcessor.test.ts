import { processFile } from '../../processors/fileProcessor';
import { ModuleType, APModuleType, ARModuleType } from '../../types';

describe('File Processor Tests', () => {
  describe('AP Module Processing', () => {
    it('should process AP0_DIV file correctly', async () => {
      const content = `
HEADER
  PROGRAM=AP0DIV
  VERSION=1.0
END_HEADER

FIELD DIV_CODE CHAR(10)
FIELD DIV_NAME CHAR(50)
FIELD ADDRESS1 CHAR(100)
FIELD CITY CHAR(50)
FIELD STATE CHAR(2)

DATA
DIV_CODE=001
DIV_NAME=MAIN DIVISION
ADDRESS1=123 MAIN ST
CITY=NEW YORK
STATE=NY
END_DATA

END
`;

      const result = await processFile(content, 'AP0_DIV');
      expect(result.success).toBe(true);
      expect(result.module).toBe(APModuleType.AP0_DIV);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        div_code: '001',
        div_name: 'MAIN DIVISION',
        address1: '123 MAIN ST',
        city: 'NEW YORK',
        state: 'NY'
      });
    });

    it('should process AP4_VEND file correctly', async () => {
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
FIELD BALANCE NUMBER(14,3)

DATA
VEND_CODE=V001
VEND_NAME=ACME SUPPLIES
ADDRESS1=456 VENDOR ST
CITY=CHICAGO
STATE=IL
ZIP_CODE=60601
TAX_ID=12-3456789
TERM_CODE=NET30
BALANCE=1234.567
END_DATA

END
`;

      const result = await processFile(content, 'AP4_VEND');
      expect(result.success).toBe(true);
      expect(result.module).toBe(APModuleType.AP4_VEND);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        vendor_code: 'V001',
        vendor_name: 'ACME SUPPLIES',
        address1: '456 VENDOR ST',
        city: 'CHICAGO',
        state: 'IL',
        zip_code: '60601',
        tax_id: '12-3456789',
        term_code: 'NET30',
        balance: 1234.567
      });
    });
  });

  describe('AR Module Processing', () => {
    it('should process AR1_CUST file correctly', async () => {
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

DATA
CUST_CODE=C001
CUST_NAME=ABC COMPANY
ADDRESS1=789 CUSTOMER AVE
CITY=LOS ANGELES
STATE=CA
ZIP_CODE=90001
CREDIT_LIMIT=50000.000
END_DATA

END
`;

      const result = await processFile(content, 'AR1_CUST');
      expect(result.success).toBe(true);
      expect(result.module).toBe(ARModuleType.AR1_CUST);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        customer_code: 'C001',
        customer_name: 'ABC COMPANY',
        address1: '789 CUSTOMER AVE',
        city: 'LOS ANGELES',
        state: 'CA',
        zip_code: '90001',
        credit_limit: 50000.000
      });
    });

    it('should process AR6_OPENINVOICE file correctly', async () => {
      const content = `
HEADER
  PROGRAM=AR6OPINV
  VERSION=1.0
END_HEADER

FIELD INVOICE_NO CHAR(20)
FIELD CUST_CODE CHAR(20)
FIELD INVOICE_DATE DATE
FIELD DUE_DATE DATE
FIELD AMOUNT NUMBER(14,3)
FIELD BALANCE NUMBER(14,3)
FIELD STATUS CHAR(20)

DATA
INVOICE_NO=INV001
CUST_CODE=C001
INVOICE_DATE=20250101
DUE_DATE=20250131
AMOUNT=1000.000
BALANCE=1000.000
STATUS=OPEN
END_DATA

END
`;

      const result = await processFile(content, 'AR6_OPENINVOICE');
      expect(result.success).toBe(true);
      expect(result.module).toBe(ARModuleType.AR6_OPENINVOICE);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        invoice_number: 'INV001',
        customer_code: 'C001',
        invoice_date: '2025-01-01T00:00:00.000Z',
        due_date: '2025-01-31T00:00:00.000Z',
        amount: 1000.000,
        balance: 1000.000,
        status: 'OPEN'
      });
    });
  });

  describe('Legacy Component Processing', () => {
    it('should process tf2g file correctly', async () => {
      const content = `
HEADER
  PROGRAM=TF2GLEDGER
  VERSION=1.0
END_HEADER

FIELD ACCOUNT_CODE CHAR(20)
FIELD DESCRIPTION CHAR(100)
FIELD BALANCE NUMBER(14,3)

DATA
ACCOUNT_CODE=1000
DESCRIPTION=CASH
BALANCE=10000.000
END_DATA

END
`;

      const result = await processFile(content, 'tf2g');
      expect(result.success).toBe(true);
      expect(result.module).toBe(ModuleType.AP);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        account_code: '1000',
        description: 'CASH',
        balance: 10000.000
      });
    });

    it('should process tf2w file correctly', async () => {
      const content = `
HEADER
  PROGRAM=TF2WFLOW
  VERSION=1.0
END_HEADER

FIELD WORKFLOW_ID CHAR(20)
FIELD DESCRIPTION CHAR(100)
FIELD STATUS CHAR(20)

DATA
WORKFLOW_ID=WF001
DESCRIPTION=INVOICE APPROVAL
STATUS=ACTIVE
END_DATA

END
`;

      const result = await processFile(content, 'tf2w');
      expect(result.success).toBe(true);
      expect(result.module).toBe(ModuleType.AR);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        workflow_id: 'WF001',
        description: 'INVOICE APPROVAL',
        status: 'ACTIVE'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file content', async () => {
      const content = 'INVALID CONTENT';
      await expect(processFile(content, 'AP0_DIV')).rejects.toThrow();
    });

    it('should handle unknown module type', async () => {
      const content = `
HEADER
  PROGRAM=UNKNOWN
  VERSION=1.0
END_HEADER
END
`;
      await expect(processFile(content, 'UNKNOWN')).rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      const content = `
HEADER
  PROGRAM=AP0DIV
  VERSION=1.0
END_HEADER

FIELD OPTIONAL_FIELD CHAR(10)

DATA
OPTIONAL_FIELD=TEST
END_DATA

END
`;
      const result = await processFile(content, 'AP0_DIV');
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_REQUIRED_FIELD',
          field: 'DIV_CODE'
        })
      );
    });
  });
});
