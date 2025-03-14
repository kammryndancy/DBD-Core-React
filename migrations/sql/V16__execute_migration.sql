-- Create master migration function
CREATE OR REPLACE FUNCTION migration.execute_migration()
RETURNS void AS $$
DECLARE
    v_log_id uuid;
    v_error_count integer := 0;
    v_error_message text;
BEGIN
    -- Start migration
    v_log_id := audit.log_migration_step('MASTER', 'ALL', 'ALL', 0, 0, 0, NULL, 'STARTED');

    -- Execute pre-migration validation
    PERFORM migration.run_premigration_checks();

    -- AP Migrations
    PERFORM migration.migrate_divisions();
    PERFORM migration.migrate_vendor_categories();
    PERFORM migration.migrate_vendors();

    -- AR Migrations
    PERFORM migration.migrate_payment_terms();
    PERFORM migration.migrate_sales_tax();
    PERFORM migration.migrate_customers();

    -- Check for any failed migrations
    SELECT 
        count(*),
        string_agg(
            source_table || ': ' || error_message,
            E'\n'
            ORDER BY started_at
        )
    INTO v_error_count, v_error_message
    FROM audit.migration_log
    WHERE status = 'FAILED'
    AND started_at >= (SELECT started_at FROM audit.migration_log WHERE id = v_log_id);

    -- Log completion status
    PERFORM audit.log_migration_step(
        'MASTER',
        'ALL',
        'ALL',
        (SELECT sum(records_processed) FROM audit.migration_log WHERE started_at >= (SELECT started_at FROM audit.migration_log WHERE id = v_log_id)),
        (SELECT sum(records_succeeded) FROM audit.migration_log WHERE started_at >= (SELECT started_at FROM audit.migration_log WHERE id = v_log_id)),
        (SELECT sum(records_failed) FROM audit.migration_log WHERE started_at >= (SELECT started_at FROM audit.migration_log WHERE id = v_log_id)),
        v_error_message,
        CASE WHEN v_error_count > 0 THEN 'FAILED' ELSE 'COMPLETED' END
    );

    -- Raise exception if any migrations failed
    IF v_error_count > 0 THEN
        RAISE EXCEPTION 'Migration failed with % errors: %', v_error_count, v_error_message;
    END IF;
END;
$$ LANGUAGE plpgsql;
