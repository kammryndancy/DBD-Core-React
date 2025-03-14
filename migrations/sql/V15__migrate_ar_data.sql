-- Create AR migration functions
CREATE OR REPLACE FUNCTION migration.migrate_payment_terms()
RETURNS void AS $$
DECLARE
    v_log_id uuid;
    v_count_success integer := 0;
    v_count_failed integer := 0;
BEGIN
    v_log_id := audit.log_migration_step('AR', 'AR2_Terms', 'accounts_receivable.payment_terms', 0, 0, 0, NULL, 'STARTED');

    INSERT INTO accounts_receivable.payment_terms (
        terms_code,
        description,
        terms_type,
        days_until_due,
        days_in_period,
        cutoff_day,
        discount_percentage,
        discount_days,
        created_by,
        updated_by
    )
    SELECT 
        trim(terms_code),
        trim(description),
        CASE 
            WHEN terms_type IN ('P', 'E', 'N', 'D') THEN terms_type 
            ELSE 'N' 
        END,
        NULLIF(days_until_due, 0),
        NULLIF(days_in_period, 0),
        NULLIF(cutoff_day, 0),
        NULLIF(discount_percentage, 0),
        NULLIF(discount_days, 0),
        'migration_user',
        'migration_user'
    FROM legacy_ar2_terms
    ON CONFLICT (terms_code) DO UPDATE
    SET 
        description = EXCLUDED.description,
        terms_type = EXCLUDED.terms_type,
        days_until_due = EXCLUDED.days_until_due,
        days_in_period = EXCLUDED.days_in_period,
        cutoff_day = EXCLUDED.cutoff_day,
        discount_percentage = EXCLUDED.discount_percentage,
        discount_days = EXCLUDED.discount_days;

    GET DIAGNOSTICS v_count_success = ROW_COUNT;
    
    PERFORM audit.log_migration_step(
        'AR',
        'AR2_Terms',
        'accounts_receivable.payment_terms',
        v_count_success,
        v_count_success,
        v_count_failed,
        NULL,
        'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql;

-- Create sales tax migration function
CREATE OR REPLACE FUNCTION migration.migrate_sales_tax()
RETURNS void AS $$
DECLARE
    v_log_id uuid;
    v_count_success integer := 0;
    v_count_failed integer := 0;
BEGIN
    v_log_id := audit.log_migration_step('AR', 'AR5_SlsTax', 'accounts_receivable.sales_tax', 0, 0, 0, NULL, 'STARTED');

    INSERT INTO accounts_receivable.sales_tax (
        tax_code,
        description,
        rate,
        state,
        county,
        city,
        is_active,
        created_by,
        updated_by
    )
    SELECT 
        trim(tax_code),
        trim(description),
        COALESCE(NULLIF(trim(rate), '')::decimal(14,3), 0),
        trim(state),
        trim(county),
        trim(city),
        status = 'A',
        'migration_user',
        'migration_user'
    FROM legacy_ar5_slstax
    ON CONFLICT (tax_code) DO UPDATE
    SET 
        description = EXCLUDED.description,
        rate = EXCLUDED.rate,
        state = EXCLUDED.state,
        county = EXCLUDED.county,
        city = EXCLUDED.city,
        is_active = EXCLUDED.is_active;

    GET DIAGNOSTICS v_count_success = ROW_COUNT;
    
    PERFORM audit.log_migration_step(
        'AR',
        'AR5_SlsTax',
        'accounts_receivable.sales_tax',
        v_count_success,
        v_count_success,
        v_count_failed,
        NULL,
        'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql;

-- Create customers migration function
CREATE OR REPLACE FUNCTION migration.migrate_customers()
RETURNS void AS $$
DECLARE
    v_log_id uuid;
    v_count_success integer := 0;
    v_count_failed integer := 0;
    v_error_message text;
BEGIN
    v_log_id := audit.log_migration_step('AR', 'AR1_Cust', 'accounts_receivable.customers', 0, 0, 0, NULL, 'STARTED');

    INSERT INTO accounts_receivable.customers (
        division_id,
        customer_code,
        name,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        phone,
        fax,
        email,
        credit_limit,
        status,
        terms_code,
        tax_id,
        credit_contact,
        credit_contact_email,
        created_by,
        updated_by
    )
    SELECT 
        d.id as division_id,
        trim(c.customer_code),
        trim(c.name),
        trim(c.address_line1),
        trim(c.address_line2),
        trim(c.city),
        trim(c.state),
        trim(c.zip_code),
        trim(c.phone),
        trim(c.fax),
        CASE 
            WHEN c.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN trim(c.email)
            ELSE NULL
        END,
        NULLIF(trim(c.credit_limit), '')::decimal(14,3),
        CASE WHEN c.status = 'I' THEN 'I' ELSE 'A' END,
        trim(c.terms_code),
        trim(c.tax_id),
        trim(c.credit_contact),
        CASE 
            WHEN c.credit_contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN trim(c.credit_contact_email)
            ELSE NULL
        END,
        'migration_user',
        'migration_user'
    FROM legacy_ar1_cust c
    LEFT JOIN accounts_payable.divisions d ON trim(c.division_code) = d.division_code
    ON CONFLICT (division_id, customer_code) DO UPDATE
    SET 
        name = EXCLUDED.name,
        address_line1 = EXCLUDED.address_line1,
        address_line2 = EXCLUDED.address_line2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip_code = EXCLUDED.zip_code,
        phone = EXCLUDED.phone,
        fax = EXCLUDED.fax,
        email = EXCLUDED.email,
        credit_limit = EXCLUDED.credit_limit,
        status = EXCLUDED.status,
        terms_code = EXCLUDED.terms_code,
        tax_id = EXCLUDED.tax_id,
        credit_contact = EXCLUDED.credit_contact,
        credit_contact_email = EXCLUDED.credit_contact_email;

    GET DIAGNOSTICS v_count_success = ROW_COUNT;
    
    -- Log any data validation errors
    WITH validation_errors AS (
        SELECT 
            customer_code,
            string_agg(error_message, '; ') as errors
        FROM (
            SELECT 
                customer_code,
                CASE
                    WHEN length(trim(customer_code)) = 0 THEN 'Invalid customer code'
                    WHEN length(trim(name)) = 0 THEN 'Missing customer name'
                    WHEN email IS NOT NULL AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 'Invalid email format'
                    WHEN credit_contact_email IS NOT NULL AND credit_contact_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 'Invalid credit contact email format'
                END as error_message
            FROM legacy_ar1_cust
            WHERE length(trim(customer_code)) = 0 
               OR length(trim(name)) = 0
               OR (email IS NOT NULL AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
               OR (credit_contact_email IS NOT NULL AND credit_contact_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
        ) e
        WHERE error_message IS NOT NULL
        GROUP BY customer_code
    )
    SELECT string_agg(customer_code || ': ' || errors, '\n')
    INTO v_error_message
    FROM validation_errors;

    IF v_error_message IS NOT NULL THEN
        v_count_failed := (SELECT count(*) FROM validation_errors);
    END IF;

    PERFORM audit.log_migration_step(
        'AR',
        'AR1_Cust',
        'accounts_receivable.customers',
        v_count_success + v_count_failed,
        v_count_success,
        v_count_failed,
        v_error_message,
        CASE WHEN v_error_message IS NULL THEN 'COMPLETED' ELSE 'FAILED' END
    );
END;
$$ LANGUAGE plpgsql;
