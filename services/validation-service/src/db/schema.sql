-- Create validation schema
CREATE SCHEMA IF NOT EXISTS validation;

-- Create validation schemas table
CREATE TABLE IF NOT EXISTS validation.schemas (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    module varchar(10) NOT NULL,  -- 'AP' or 'AR'
    entity varchar(50) NOT NULL,
    schema_definition jsonb NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schemas_module_entity ON validation.schemas(module, entity);
CREATE INDEX IF NOT EXISTS idx_schemas_active ON validation.schemas(active);

-- Add full-text search capabilities
CREATE INDEX IF NOT EXISTS idx_schemas_search ON validation.schemas 
USING gin(to_tsvector('english', entity || ' ' || schema_definition::text));

-- Create validation rules table
CREATE TABLE IF NOT EXISTS validation.rules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    module varchar(10) NOT NULL,  -- 'AP' or 'AR'
    entity varchar(50) NOT NULL,
    rule_name varchar(100) NOT NULL,
    rule_type varchar(50) NOT NULL,  -- 'format', 'range', 'required', etc.
    rule_definition jsonb NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Add indexes for validation rules
CREATE INDEX IF NOT EXISTS idx_rules_module_entity ON validation.rules(module, entity);
CREATE INDEX IF NOT EXISTS idx_rules_active ON validation.rules(active);

-- Create validation audit log
CREATE TABLE IF NOT EXISTS validation.audit_log (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    module varchar(10) NOT NULL,
    entity varchar(50) NOT NULL,
    record_id varchar(100) NOT NULL,
    validation_result boolean NOT NULL,
    errors jsonb,
    validation_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL
);

-- Add indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_module_entity ON validation.audit_log(module, entity);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON validation.audit_log(validation_timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION validation.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_schemas_timestamp
    BEFORE UPDATE ON validation.schemas
    FOR EACH ROW
    EXECUTE FUNCTION validation.update_updated_at();

CREATE TRIGGER update_rules_timestamp
    BEFORE UPDATE ON validation.rules
    FOR EACH ROW
    EXECUTE FUNCTION validation.update_updated_at();

-- Add row-level security
ALTER TABLE validation.schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation.audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for row-level security
CREATE POLICY schemas_access_policy ON validation.schemas
    USING (true)  -- Allow read access to all authenticated users
    WITH CHECK (created_by = current_user);  -- Only allow modifications by creator

CREATE POLICY rules_access_policy ON validation.rules
    USING (true)  -- Allow read access to all authenticated users
    WITH CHECK (created_by = current_user);  -- Only allow modifications by creator

CREATE POLICY audit_log_access_policy ON validation.audit_log
    USING (true);  -- Allow read access to all authenticated users

-- Insert default validation schemas for AP module
INSERT INTO validation.schemas (module, entity, schema_definition, created_by, updated_by)
VALUES 
('AP', 'vendor', '{
    "type": "object",
    "properties": {
        "vendorCode": {"type": "string", "format": "varchar", "maxLength": 50},
        "name": {"type": "string", "format": "varchar", "maxLength": 100},
        "taxId": {"type": "string", "format": "varchar", "maxLength": 20},
        "status": {"type": "string", "enum": ["A", "I"]},
        "divisionId": {"type": "string", "format": "uuid"}
    },
    "required": ["vendorCode", "name", "status", "divisionId"]
}', 'system', 'system'),

('AP', 'invoice', '{
    "type": "object",
    "properties": {
        "vendorId": {"type": "string", "format": "uuid"},
        "invoiceNumber": {"type": "string", "format": "varchar", "maxLength": 50},
        "invoiceDate": {"type": "string", "format": "timestamp_tz"},
        "amount": {"type": "string", "format": "decimal14_3"},
        "divisionId": {"type": "string", "format": "uuid"}
    },
    "required": ["vendorId", "invoiceNumber", "invoiceDate", "amount", "divisionId"]
}', 'system', 'system');

-- Insert default validation schemas for AR module
INSERT INTO validation.schemas (module, entity, schema_definition, created_by, updated_by)
VALUES 
('AR', 'customer', '{
    "type": "object",
    "properties": {
        "customerCode": {"type": "string", "format": "varchar", "maxLength": 50},
        "name": {"type": "string", "format": "varchar", "maxLength": 100},
        "taxId": {"type": "string", "format": "varchar", "maxLength": 20},
        "status": {"type": "string", "enum": ["A", "I"]},
        "divisionId": {"type": "string", "format": "uuid"},
        "creditLimit": {"type": "string", "format": "decimal14_3"}
    },
    "required": ["customerCode", "name", "status", "divisionId"]
}', 'system', 'system'),

('AR', 'invoice', '{
    "type": "object",
    "properties": {
        "customerId": {"type": "string", "format": "uuid"},
        "invoiceNumber": {"type": "string", "format": "varchar", "maxLength": 50},
        "invoiceDate": {"type": "string", "format": "timestamp_tz"},
        "amount": {"type": "string", "format": "decimal14_3"},
        "salesTaxAmount": {"type": "string", "format": "decimal14_3"},
        "divisionId": {"type": "string", "format": "uuid"}
    },
    "required": ["customerId", "invoiceNumber", "invoiceDate", "amount", "divisionId"]
}', 'system', 'system');
