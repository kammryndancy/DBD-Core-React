-- Create validation functions
CREATE OR REPLACE FUNCTION migration.validate_email(p_email text)
RETURNS boolean AS $$
BEGIN
    RETURN p_email IS NULL OR p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Create data validation functions
CREATE OR REPLACE FUNCTION migration.validate_ap_data()
RETURNS TABLE (
    table_name text,
    validation_type text,
    failed_records bigint,
    sample_failures text
) AS $$
BEGIN
    -- Validate divisions
    RETURN QUERY
    SELECT 
        'AP0_Div'::text as table_name,
        'Missing Required Fields'::text as validation_type,
        count(*)::bigint as failed_records,
        string_agg(division_code::text, ', ') as sample_failures
    FROM legacy_ap0_div
    WHERE trim(division_code) = '' OR trim(description) = '';

    -- Validate vendor categories
    RETURN QUERY
    SELECT 
        'AP3_VendCatg'::text,
        'Missing Required Fields'::text,
        count(*)::bigint,
        string_agg(category_code::text, ', ')
    FROM legacy_ap3_vendcatg
    WHERE trim(category_code) = '' OR trim(description) = '';

    -- Validate vendors
    RETURN QUERY
    SELECT 
        'AP4_Vend'::text,
        'Invalid Email Format'::text,
        count(*)::bigint,
        string_agg(vendor_code::text, ', ')
    FROM legacy_ap4_vend
    WHERE email IS NOT NULL 
    AND NOT migration.validate_email(email);

    RETURN QUERY
    SELECT 
        'AP4_Vend'::text,
        'Missing Required Fields'::text,
        count(*)::bigint,
        string_agg(vendor_code::text, ', ')
    FROM legacy_ap4_vend
    WHERE trim(vendor_code) = '' 
    OR trim(name) = '';
END;
$$ LANGUAGE plpgsql;

-- Create AR data validation function
CREATE OR REPLACE FUNCTION migration.validate_ar_data()
RETURNS TABLE (
    table_name text,
    validation_type text,
    failed_records bigint,
    sample_failures text
) AS $$
BEGIN
    -- Validate payment terms
    RETURN QUERY
    SELECT 
        'AR2_Terms'::text as table_name,
        'Missing Required Fields'::text as validation_type,
        count(*)::bigint as failed_records,
        string_agg(terms_code::text, ', ') as sample_failures
    FROM legacy_ar2_terms
    WHERE trim(terms_code) = '' OR trim(description) = '';

    -- Validate sales tax
    RETURN QUERY
    SELECT 
        'AR5_SlsTax'::text,
        'Invalid Tax Rate'::text,
        count(*)::bigint,
        string_agg(tax_code::text, ', ')
    FROM legacy_ar5_slstax
    WHERE rate < 0 OR rate > 100;

    -- Validate customers
    RETURN QUERY
    SELECT 
        'AR1_Cust'::text,
        'Invalid Email Format'::text,
        count(*)::bigint,
        string_agg(customer_code::text, ', ')
    FROM legacy_ar1_cust
    WHERE (email IS NOT NULL AND NOT migration.validate_email(email))
    OR (credit_contact_email IS NOT NULL AND NOT migration.validate_email(credit_contact_email));

    RETURN QUERY
    SELECT 
        'AR1_Cust'::text,
        'Missing Required Fields'::text,
        count(*)::bigint,
        string_agg(customer_code::text, ', ')
    FROM legacy_ar1_cust
    WHERE trim(customer_code) = '' 
    OR trim(name) = '';

    -- Validate credit limits
    RETURN QUERY
    SELECT 
        'AR1_Cust'::text,
        'Invalid Credit Limit'::text,
        count(*)::bigint,
        string_agg(customer_code::text, ', ')
    FROM legacy_ar1_cust
    WHERE credit_limit < 0;
END;
$$ LANGUAGE plpgsql;

-- Create data integrity check function
CREATE OR REPLACE FUNCTION migration.check_data_integrity()
RETURNS TABLE (
    check_type text,
    table_name text,
    failed_count bigint,
    details text
) AS $$
BEGIN
    -- Check for orphaned records
    RETURN QUERY
    SELECT 
        'Orphaned Records'::text as check_type,
        'AP4_Vend'::text as table_name,
        count(*)::bigint as failed_count,
        'Vendors without valid division'::text as details
    FROM legacy_ap4_vend v
    LEFT JOIN legacy_ap0_div d ON trim(v.division_code) = trim(d.division_code)
    WHERE d.division_code IS NULL;

    RETURN QUERY
    SELECT 
        'Orphaned Records'::text,
        'AP4_Vend'::text,
        count(*)::bigint,
        'Vendors without valid category'::text
    FROM legacy_ap4_vend v
    LEFT JOIN legacy_ap3_vendcatg c ON trim(v.category_code) = trim(c.category_code)
    WHERE v.category_code IS NOT NULL 
    AND c.category_code IS NULL;

    -- Check for duplicate records
    RETURN QUERY
    SELECT 
        'Duplicate Records'::text,
        'AP4_Vend'::text,
        count(*)::bigint,
        'Multiple vendors with same code in division'::text
    FROM (
        SELECT division_code, vendor_code, COUNT(*)
        FROM legacy_ap4_vend
        GROUP BY division_code, vendor_code
        HAVING COUNT(*) > 1
    ) dupes;

    RETURN QUERY
    SELECT 
        'Duplicate Records'::text,
        'AR1_Cust'::text,
        count(*)::bigint,
        'Multiple customers with same code in division'::text
    FROM (
        SELECT division_code, customer_code, COUNT(*)
        FROM legacy_ar1_cust
        GROUP BY division_code, customer_code
        HAVING COUNT(*) > 1
    ) dupes;
END;
$$ LANGUAGE plpgsql;
