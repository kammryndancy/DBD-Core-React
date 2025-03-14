-- Add triggers for customers
CREATE TRIGGER audit_customers_trigger
AFTER INSERT OR UPDATE OR DELETE ON accounts_receivable.customers
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger();

CREATE TRIGGER update_customers_timestamp
BEFORE UPDATE ON accounts_receivable.customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add triggers for invoices
CREATE TRIGGER audit_invoices_trigger
AFTER INSERT OR UPDATE OR DELETE ON accounts_receivable.invoices
FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger();

CREATE TRIGGER update_invoices_timestamp
BEFORE UPDATE ON accounts_receivable.invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE accounts_receivable.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable.invoices ENABLE ROW LEVEL SECURITY;

-- Create access policies
CREATE POLICY customer_access_policy ON accounts_receivable.customers
    USING (created_by = current_user OR 
           current_user IN (SELECT unnest(regexp_split_to_array(current_setting('app.authorized_users'), ','))));

CREATE POLICY invoice_access_policy ON accounts_receivable.invoices
    USING (created_by = current_user OR 
           current_user IN (SELECT unnest(regexp_split_to_array(current_setting('app.authorized_users'), ','))));

-- Add table comments
COMMENT ON TABLE accounts_receivable.customers IS 'Stores customer information with modern PostgreSQL features';
COMMENT ON COLUMN accounts_receivable.customers.status IS 'A=Active, I=Inactive';
COMMENT ON TABLE accounts_receivable.invoices IS 'Stores invoice information with modern PostgreSQL features';
COMMENT ON COLUMN accounts_receivable.invoices.status IS 'O=Open, P=Partial, C=Closed';
