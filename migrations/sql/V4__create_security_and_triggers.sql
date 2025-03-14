-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for vendors
CREATE TRIGGER audit_vendors_trigger
AFTER INSERT OR UPDATE OR DELETE ON accounts_payable.vendors
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger();

CREATE TRIGGER update_vendors_timestamp
BEFORE UPDATE ON accounts_payable.vendors
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE accounts_payable.vendors ENABLE ROW LEVEL SECURITY;

-- Create access policy
CREATE POLICY vendor_access_policy ON accounts_payable.vendors
    USING (created_by = current_user OR 
           current_user IN (SELECT unnest(regexp_split_to_array(current_setting('app.authorized_users'), ','))));

-- Add table comments
COMMENT ON TABLE accounts_payable.vendors IS 'Stores vendor information with modern PostgreSQL features';
COMMENT ON COLUMN accounts_payable.vendors.id IS 'Primary key - UUID v4';
COMMENT ON COLUMN accounts_payable.vendors.status IS 'A=Active, I=Inactive';
