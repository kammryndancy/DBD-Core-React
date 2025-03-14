-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create schemas
CREATE SCHEMA accounts_payable;
CREATE SCHEMA accounts_receivable;
CREATE SCHEMA audit;

-- Create audit function
CREATE OR REPLACE FUNCTION audit.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            new_data,
            changed_by
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(NEW),
            current_user
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            old_data,
            new_data,
            changed_by
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            row_to_json(NEW),
            current_user
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            old_data,
            changed_by
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            current_user
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE audit.audit_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name varchar(100) NOT NULL,
    operation varchar(20) NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_by varchar(100) NOT NULL,
    changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
