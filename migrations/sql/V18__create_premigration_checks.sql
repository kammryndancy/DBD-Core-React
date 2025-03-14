-- Create pre-migration validation function
CREATE OR REPLACE FUNCTION migration.run_premigration_checks()
RETURNS void AS $$
DECLARE
    v_ap_validation_results record;
    v_ar_validation_results record;
    v_integrity_results record;
    v_error_messages text[];
    v_final_message text;
BEGIN
    -- Check AP data
    FOR v_ap_validation_results IN SELECT * FROM migration.validate_ap_data() LOOP
        IF v_ap_validation_results.failed_records > 0 THEN
            v_error_messages := array_append(
                v_error_messages,
                format(
                    'AP Validation Error - %s: %s (%s records) - Sample: %s',
                    v_ap_validation_results.table_name,
                    v_ap_validation_results.validation_type,
                    v_ap_validation_results.failed_records,
                    v_ap_validation_results.sample_failures
                )
            );
        END IF;
    END LOOP;

    -- Check AR data
    FOR v_ar_validation_results IN SELECT * FROM migration.validate_ar_data() LOOP
        IF v_ar_validation_results.failed_records > 0 THEN
            v_error_messages := array_append(
                v_error_messages,
                format(
                    'AR Validation Error - %s: %s (%s records) - Sample: %s',
                    v_ar_validation_results.table_name,
                    v_ar_validation_results.validation_type,
                    v_ar_validation_results.failed_records,
                    v_ar_validation_results.sample_failures
                )
            );
        END IF;
    END LOOP;

    -- Check data integrity
    FOR v_integrity_results IN SELECT * FROM migration.check_data_integrity() LOOP
        IF v_integrity_results.failed_count > 0 THEN
            v_error_messages := array_append(
                v_error_messages,
                format(
                    'Data Integrity Error - %s in %s: %s (%s records)',
                    v_integrity_results.check_type,
                    v_integrity_results.table_name,
                    v_integrity_results.details,
                    v_integrity_results.failed_count
                )
            );
        END IF;
    END LOOP;

    -- If any validation errors were found, raise an exception
    IF array_length(v_error_messages, 1) > 0 THEN
        v_final_message := array_to_string(v_error_messages, E'\n');
        RAISE EXCEPTION 'Pre-migration validation failed:\n%', v_final_message;
    END IF;

    -- Log successful validation
    PERFORM audit.log_migration_step(
        'VALIDATION',
        'ALL',
        'ALL',
        0,
        0,
        0,
        NULL,
        'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to generate validation report
CREATE OR REPLACE FUNCTION migration.generate_validation_report()
RETURNS TABLE (
    category text,
    issue_type text,
    table_name text,
    description text,
    record_count bigint,
    sample_data text
) AS $$
BEGIN
    -- AP Validation Issues
    RETURN QUERY
    SELECT 
        'AP Data Validation'::text as category,
        validation_type as issue_type,
        table_name,
        'Data validation failed'::text as description,
        failed_records as record_count,
        sample_failures as sample_data
    FROM migration.validate_ap_data()
    WHERE failed_records > 0;

    -- AR Validation Issues
    RETURN QUERY
    SELECT 
        'AR Data Validation'::text as category,
        validation_type as issue_type,
        table_name,
        'Data validation failed'::text as description,
        failed_records as record_count,
        sample_failures as sample_data
    FROM migration.validate_ar_data()
    WHERE failed_records > 0;

    -- Data Integrity Issues
    RETURN QUERY
    SELECT 
        'Data Integrity'::text as category,
        check_type as issue_type,
        table_name,
        details as description,
        failed_count as record_count,
        ''::text as sample_data
    FROM migration.check_data_integrity()
    WHERE failed_count > 0;
END;
$$ LANGUAGE plpgsql;
