-- Create AP migration functions
CREATE OR REPLACE FUNCTION migration.migrate_divisions()
RETURNS void AS $$
DECLARE
    v_log_id uuid;
    v_count_success integer := 0;
    v_count_failed integer := 0;
BEGIN
    v_log_id := audit.log_migration_step('AP', 'AP0_Div', 'accounts_payable.divisions', 0, 0, 0, NULL, 'STARTED');

    INSERT INTO accounts_payable.divisions (
        division_code,
        description,
        created_by,
        updated_by
    )
    SELECT 
        trim(division_code),
        trim(description),
        'migration_user',
        'migration_user'
    FROM legacy_ap0_div
    ON CONFLICT (division_code) DO UPDATE
    SET description = EXCLUDED.description;

    GET DIAGNOSTICS v_count_success = ROW_COUNT;
    
    PERFORM audit.log_migration_step(
        'AP',
        'AP0_Div',
        'accounts_payable.divisions',
        v_count_success,
        v_count_success,
        v_count_failed,
        NULL,
        'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql;

-- Create vendor categories migration function
CREATE OR REPLACE FUNCTION migration.migrate_vendor_categories()
RETURNS void AS $$
DECLARE
    v_log_id uuid;
    v_count_success integer := 0;
    v_count_failed integer := 0;
BEGIN
    v_log_id := audit.log_migration_step('AP', 'AP3_VendCatg', 'accounts_payable.vendor_categories', 0, 0, 0, NULL, 'STARTED');

    INSERT INTO accounts_payable.vendor_categories (
        category_code,
        description,
        created_by,
        updated_by
    )
    SELECT 
        trim(category_code),
        trim(description),
        'migration_user',
        'migration_user'
    FROM legacy_ap3_vendcatg
    ON CONFLICT (category_code) DO UPDATE
    SET description = EXCLUDED.description;

    GET DIAGNOSTICS v_count_success = ROW_COUNT;
    
    PERFORM audit.log_migration_step(
        'AP',
        'AP3_VendCatg',
        'accounts_payable.vendor_categories',
        v_count_success,
        v_count_success,
        v_count_failed,
        NULL,
        'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql;

-- Create vendors migration function
CREATE OR REPLACE FUNCTION migration.migrate_vendors()
RETURNS void AS $$
DECLARE
    v_log_id uuid;
    v_count_success integer := 0;
    v_count_failed integer := 0;
    v_error_message text;
BEGIN
    v_log_id := audit.log_migration_step('AP', 'AP4_Vend', 'accounts_payable.vendors', 0, 0, 0, NULL, 'STARTED');

    INSERT INTO accounts_payable.vendors (
        division_id,
        vendor_code,
        name,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        phone,
        fax,
        contact_person,
        email,
        status,
        category_id,
        terms_code,
        tax_id,
        created_by,
        updated_by
    )
    SELECT 
        d.id as division_id,
        trim(v.vendor_code),
        trim(v.name),
        trim(v.address_line1),
        trim(v.address_line2),
        trim(v.city),
        trim(v.state),
        trim(v.zip_code),
        trim(v.phone),
        trim(v.fax),
        trim(v.contact_person),
        CASE 
            WHEN v.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN trim(v.email)
            ELSE NULL
        END,
        CASE WHEN v.status = 'I' THEN 'I' ELSE 'A' END,
        vc.id as category_id,
        trim(v.terms_code),
        trim(v.tax_id),
        'migration_user',
        'migration_user'
    FROM legacy_ap4_vend v
    LEFT JOIN accounts_payable.divisions d ON trim(v.division_code) = d.division_code
    LEFT JOIN accounts_payable.vendor_categories vc ON trim(v.category_code) = vc.category_code
    ON CONFLICT (division_id, vendor_code) DO UPDATE
    SET 
        name = EXCLUDED.name,
        address_line1 = EXCLUDED.address_line1,
        address_line2 = EXCLUDED.address_line2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip_code = EXCLUDED.zip_code,
        phone = EXCLUDED.phone,
        fax = EXCLUDED.fax,
        contact_person = EXCLUDED.contact_person,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        category_id = EXCLUDED.category_id,
        terms_code = EXCLUDED.terms_code,
        tax_id = EXCLUDED.tax_id;

    GET DIAGNOSTICS v_count_success = ROW_COUNT;
    
    -- Log any data validation errors
    WITH validation_errors AS (
        SELECT 
            vendor_code,
            string_agg(error_message, '; ') as errors
        FROM (
            SELECT 
                vendor_code,
                CASE
                    WHEN length(trim(vendor_code)) = 0 THEN 'Invalid vendor code'
                    WHEN length(trim(name)) = 0 THEN 'Missing vendor name'
                    WHEN email IS NOT NULL AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 'Invalid email format'
                END as error_message
            FROM legacy_ap4_vend
            WHERE length(trim(vendor_code)) = 0 
               OR length(trim(name)) = 0
               OR (email IS NOT NULL AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
        ) e
        WHERE error_message IS NOT NULL
        GROUP BY vendor_code
    )
    SELECT string_agg(vendor_code || ': ' || errors, '\n')
    INTO v_error_message
    FROM validation_errors;

    IF v_error_message IS NOT NULL THEN
        v_count_failed := (SELECT count(*) FROM validation_errors);
    END IF;

    PERFORM audit.log_migration_step(
        'AP',
        'AP4_Vend',
        'accounts_payable.vendors',
        v_count_success + v_count_failed,
        v_count_success,
        v_count_failed,
        v_error_message,
        CASE WHEN v_error_message IS NULL THEN 'COMPLETED' ELSE 'FAILED' END
    );
END;
$$ LANGUAGE plpgsql;
