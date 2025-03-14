# PVX to PostgreSQL Migration Guide

This guide provides step-by-step instructions for migrating PVX data to PostgreSQL using the provided migration scripts.

## Prerequisites

1. **Environment Setup**
   ```bash
   # Required environment variables
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=pvx_migration
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   BACKUP_DIR=./backups
   ```

2. **Directory Structure**
   - Place all PVX files (`.pxprg`) in a single source directory
   - Ensure files follow the naming convention: `AP0_Div.pxprg`, `AP4_Vend.pxprg`, etc.

## Migration Steps

### 1. Pre-Migration Validation

```bash
# Validate PVX files before migration
ts-node src/scripts/migrate.ts /path/to/pvx/files --validate-only
```

This will:
- Check file formats
- Validate data types
- Verify required fields
- Report any issues before actual migration

### 2. Create Database Backup (if existing data)

```bash
# Create a backup of the current database
ts-node src/scripts/backup.ts backup
```

The backup will be stored in `./backups` with timestamp.

### 3. Run Database Migration

```bash
# Execute the full migration
ts-node src/scripts/migrate.ts /path/to/pvx/files \
  --add-audit-fields \
  --use-uuid-primary-keys \
  --add-foreign-key-constraints \
  --enable-row-level-security \
  --enable-full-text-search
```

Migration order:
1. AP Module:
   - AP0_Div (Divisions)
   - AP2_Term (Payment terms)
   - AP3_VendCatg (Vendor categories)
   - AP5_VendStatus (Vendor status)
   - AP4_Vend (Vendors)
   - AP8_VendMsg (Vendor messages)
   - AP9_VendStats (Vendor statistics)
   - APA_InvoiceEntManChk (AP Invoices)

2. AR Module:
   - AR2_Terms (AR payment terms)
   - AR5_SlsTax (Sales tax)
   - AR1_Cust (Customers)
   - AR6_OpenInvoice (Open invoices)
   - ARA_SlspersonStats (Salesperson statistics)
   - ARB_InvoiceEntHdr (AR Invoices)

### 4. Post-Migration Validation

```bash
# Validate the migrated data
ts-node src/scripts/validate.ts \
  --check-data-types \
  --check-constraints \
  --check-audit-fields \
  --check-relationships \
  --check-indexes \
  --check-rls \
  --check-search
```

This validates:
- Data type conversions
- Foreign key constraints
- Audit field presence
- Index optimization
- Row-level security
- Full-text search configuration

### 5. Data Quality Check

```bash
# Run data quality checks
ts-node src/scripts/validate.ts --check-data-quality
```

Verifies:
- No orphaned records
- No duplicate unique values
- Required fields are populated
- Relationships are valid

### 6. Create Post-Migration Backup

```bash
# Backup the migrated database
ts-node src/scripts/backup.ts backup --include-schema
```

## Troubleshooting

### Common Issues

1. **Missing Dependencies**
   ```bash
   # Install required dependencies
   npm install pg @types/pg typescript ts-node
   ```

2. **Permission Issues**
   - Ensure PostgreSQL user has necessary privileges
   - Check file system permissions for backup directory

3. **Data Type Mismatches**
   - Review data type mappings in `src/processors/pvxProcessor.ts`
   - Adjust field lengths if necessary

4. **Foreign Key Violations**
   - Check data integrity in source files
   - Verify migration order

### Recovery Steps

1. **Restore from Backup**
   ```bash
   # Restore from the latest backup
   ts-node src/scripts/backup.ts restore /path/to/backup.sql
   ```

2. **Partial Migration**
   ```bash
   # Migrate specific modules only
   ts-node src/scripts/migrate.ts /path/to/pvx/files --modules AP0_Div,AP4_Vend
   ```

## Monitoring and Logging

- Migration progress is logged to `logs/migration.log`
- Check PostgreSQL logs for database-specific issues
- Monitor system resources during migration

## Post-Migration Tasks

1. **Update Applications**
   - Update connection strings
   - Verify application functionality
   - Test data access patterns

2. **Performance Optimization**
   - Review and adjust indexes
   - Analyze query performance
   - Update statistics

3. **Security Setup**
   - Configure row-level security policies
   - Set up user roles and permissions
   - Review audit logging

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Review error messages in PostgreSQL logs
3. Contact support team with log files and error details
