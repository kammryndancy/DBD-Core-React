-- Create migration logging table
CREATE TABLE audit.migration_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    migration_type varchar(50) NOT NULL,
    source_table varchar(100) NOT NULL,
    target_table varchar(100) NOT NULL,
    records_processed integer DEFAULT 0,
    records_succeeded integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    error_message text,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp with time zone,
    status varchar(20) CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED')),
    created_by varchar(100) NOT NULL
);

-- Create function to log migration steps
CREATE OR REPLACE FUNCTION audit.log_migration_step(
    p_migration_type varchar(50),
    p_source_table varchar(100),
    p_target_table varchar(100),
    p_records_processed integer,
    p_records_succeeded integer,
    p_records_failed integer,
    p_error_message text DEFAULT NULL,
    p_status varchar(20)
)
RETURNS uuid AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO audit.migration_log (
        migration_type,
        source_table,
        target_table,
        records_processed,
        records_succeeded,
        records_failed,
        error_message,
        status,
        completed_at,
        created_by
    ) VALUES (
        p_migration_type,
        p_source_table,
        p_target_table,
        p_records_processed,
        p_records_succeeded,
        p_records_failed,
        p_error_message,
        p_status,
        CASE WHEN p_status IN ('COMPLETED', 'FAILED') THEN CURRENT_TIMESTAMP ELSE NULL END,
        current_user
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle data type conversion
CREATE OR REPLACE FUNCTION migration.convert_data_type(
    p_value text,
    p_target_type text
)
RETURNS text AS $$
BEGIN
    CASE p_target_type
        WHEN 'uuid' THEN
            RETURN CASE 
                WHEN p_value IS NULL OR trim(p_value) = '' THEN NULL
                ELSE uuid_generate_v4()::text
            END;
        WHEN 'timestamp' THEN
            RETURN CASE 
                WHEN p_value IS NULL OR trim(p_value) = '' THEN NULL
                ELSE to_timestamp(p_value, 'YYYY-MM-DD HH24:MI:SS')::text
            END;
        WHEN 'numeric' THEN
            RETURN CASE 
                WHEN p_value IS NULL OR trim(p_value) = '' THEN '0'
                ELSE trim(regexp_replace(p_value, '[^0-9.-]', '', 'g'))
            END;
        WHEN 'boolean' THEN
            RETURN CASE 
                WHEN upper(p_value) IN ('Y', 'YES', 'T', 'TRUE', '1') THEN 'true'
                ELSE 'false'
            END;
        ELSE
            RETURN p_value;
    END CASE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;
