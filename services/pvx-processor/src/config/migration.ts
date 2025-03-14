/**
 * Configuration for PVX to PostgreSQL migration
 */
export const migrationConfig = {
  // Data type mappings
  dataTypes: {
    'CHAR': 'VARCHAR',
    'NUMBER': 'DECIMAL',
    'DATE': 'TIMESTAMP WITH TIME ZONE',
  },

  // Default field lengths
  fieldLengths: {
    'VARCHAR': 255,
    'DECIMAL': {
      precision: 14,
      scale: 3,
    },
  },

  // Module configurations
  modules: {
    ap: {
      tables: {
        'AP0_DIV': {
          description: 'Division information',
          requiredFields: ['DIV_CODE', 'DIV_NAME'],
          indexes: ['DIV_CODE'],
        },
        'AP2_TERM': {
          description: 'Payment terms',
          requiredFields: ['TERM_CODE', 'DESCRIPTION', 'DAYS'],
          indexes: ['TERM_CODE'],
        },
        'AP3_VENDCATG': {
          description: 'Vendor categories',
          requiredFields: ['CATEGORY_CODE', 'DESCRIPTION'],
          indexes: ['CATEGORY_CODE'],
        },
        'AP4_VEND': {
          description: 'Vendor master data',
          requiredFields: ['VEND_CODE', 'VEND_NAME'],
          indexes: ['VEND_CODE', 'VEND_NAME'],
          fullTextSearch: ['VEND_NAME', 'ADDRESS1', 'ADDRESS2', 'CITY'],
        },
        'AP5_VENDSTATUS': {
          description: 'Vendor status and 1099 info',
          requiredFields: ['VEND_CODE', 'STATUS'],
          indexes: ['VEND_CODE', 'STATUS'],
        },
        'AP8_VENDMSG': {
          description: 'Vendor messages',
          requiredFields: ['VEND_CODE', 'MESSAGE'],
          indexes: ['VEND_CODE'],
        },
        'AP9_VENDSTATS': {
          description: 'Vendor statistics',
          requiredFields: ['VEND_CODE', 'PERIOD'],
          indexes: ['VEND_CODE', 'PERIOD'],
        },
        'APA_INVOICEENTMANCHK': {
          description: 'Invoice entry',
          requiredFields: ['INVOICE_NO', 'VEND_CODE', 'AMOUNT'],
          indexes: ['INVOICE_NO', 'VEND_CODE'],
        },
      },
    },
    ar: {
      tables: {
        'AR1_CUST': {
          description: 'Customer information',
          requiredFields: ['CUST_CODE', 'CUST_NAME'],
          indexes: ['CUST_CODE', 'CUST_NAME'],
          fullTextSearch: ['CUST_NAME', 'ADDRESS1', 'ADDRESS2', 'CITY'],
        },
        'AR2_TERMS': {
          description: 'Payment terms',
          requiredFields: ['TERM_CODE', 'DESCRIPTION', 'DAYS'],
          indexes: ['TERM_CODE'],
        },
        'AR5_SLSTAX': {
          description: 'Sales tax',
          requiredFields: ['TAX_CODE', 'RATE'],
          indexes: ['TAX_CODE'],
        },
        'AR6_OPENINVOICE': {
          description: 'Open invoices',
          requiredFields: ['INVOICE_NO', 'CUST_CODE', 'AMOUNT'],
          indexes: ['INVOICE_NO', 'CUST_CODE'],
        },
        'ARA_SLSPERSONSTATS': {
          description: 'Salesperson statistics',
          requiredFields: ['SLSPERSON_CODE', 'PERIOD'],
          indexes: ['SLSPERSON_CODE', 'PERIOD'],
        },
        'ARB_INVOICEENTHDR': {
          description: 'Invoice entry header',
          requiredFields: ['INVOICE_NO', 'CUST_CODE'],
          indexes: ['INVOICE_NO', 'CUST_CODE'],
        },
      },
    },
  },

  // Modern PostgreSQL features
  features: {
    // Row-level security configuration
    rowLevelSecurity: {
      enabled: true,
      policies: {
        view: {
          role: 'authenticated_users',
          using: 'true',
        },
        modify: {
          role: 'data_managers',
          using: 'true',
          withCheck: 'true',
        },
      },
    },

    // Audit fields configuration
    audit: {
      enabled: true,
      fields: {
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP',
        created_by: 'UUID REFERENCES users(id)',
        updated_by: 'UUID REFERENCES users(id)',
      },
      triggers: {
        update: true,
        delete: true,
      },
    },

    // Full-text search configuration
    fullTextSearch: {
      enabled: true,
      language: 'english',
      vectorColumn: 'search_vector',
      indexType: 'GIN',
    },

    // Primary key configuration
    primaryKeys: {
      type: 'UUID',
      default: 'gen_random_uuid()',
    },

    // Foreign key configuration
    foreignKeys: {
      enabled: true,
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },

    // Indexing strategy
    indexing: {
      btree: ['_code', '_id', '_no'],
      gin: ['search_vector'],
      concurrently: true,
    },
  },

  // Legacy PVX components mapping
  legacyComponents: {
    'tf2g': {
      type: 'AP',
      description: 'General ledger components',
      handler: 'apProcessor',
    },
    'tf2w': {
      type: 'AR',
      description: 'Workflow components',
      handler: 'arProcessor',
    },
    'tf2z': {
      type: 'SYSTEM',
      description: 'System configuration components',
      handler: 'systemProcessor',
    },
  },
};
