-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create audit function for tracking user actions
CREATE OR REPLACE FUNCTION audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        action,
        record_id,
        old_data,
        new_data,
        user_id,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
            WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN NULL
            ELSE row_to_json(NEW)
        END,
        current_setting('app.user_id', TRUE)::UUID,
        current_setting('app.client_ip', TRUE)
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    action VARCHAR(8) NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create divisions table (AP0_Div)
CREATE TABLE divisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_code VARCHAR(10) UNIQUE NOT NULL,
    division_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create payment terms tables (AP2_Term, AR2_Terms)
CREATE TABLE payment_terms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    term_code VARCHAR(10) UNIQUE NOT NULL,
    description VARCHAR(100) NOT NULL,
    days_until_due INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2),
    discount_days INTEGER,
    module_type VARCHAR(2) NOT NULL, -- 'AP' or 'AR'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create vendor categories table (AP3_VendCatg)
CREATE TABLE vendor_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_code VARCHAR(10) UNIQUE NOT NULL,
    description VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create vendor status table (AP5_VendStatus)
CREATE TABLE vendor_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    status_code VARCHAR(10) UNIQUE NOT NULL,
    description VARCHAR(100) NOT NULL,
    is_1099 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create vendors table (AP4_Vend)
CREATE TABLE vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vendor_code VARCHAR(20) UNIQUE NOT NULL,
    vendor_name VARCHAR(100) NOT NULL,
    division_id UUID REFERENCES divisions(id),
    category_id UUID REFERENCES vendor_categories(id),
    status_id UUID REFERENCES vendor_status(id),
    payment_terms_id UUID REFERENCES payment_terms(id),
    tax_id VARCHAR(20),
    address_line1 VARCHAR(100),
    address_line2 VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(vendor_code, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(vendor_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(contact_name, '')), 'C')
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create vendor messages table (AP8_VendMsg)
CREATE TABLE vendor_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id),
    message_text TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create vendor statistics table (AP9_VendStats)
CREATE TABLE vendor_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    invoice_count INTEGER DEFAULT 0,
    total_amount DECIMAL(14,3) DEFAULT 0,
    average_days_to_pay INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(vendor_id, year, month)
);

-- Create customers table (AR1_Cust)
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    division_id UUID REFERENCES divisions(id),
    payment_terms_id UUID REFERENCES payment_terms(id),
    credit_limit DECIMAL(14,3),
    tax_exempt BOOLEAN DEFAULT FALSE,
    tax_id VARCHAR(20),
    address_line1 VARCHAR(100),
    address_line2 VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(customer_code, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(customer_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(contact_name, '')), 'C')
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create sales tax table (AR5_SlsTax)
CREATE TABLE sales_tax (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tax_code VARCHAR(10) UNIQUE NOT NULL,
    description VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    state VARCHAR(2),
    county VARCHAR(50),
    city VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create open invoices table (AR6_OpenInvoice)
CREATE TABLE open_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(14,3) NOT NULL,
    balance DECIMAL(14,3) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create salesperson statistics table (ARA_SlspersonStats)
CREATE TABLE salesperson_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salesperson_id UUID NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    sales_count INTEGER DEFAULT 0,
    sales_amount DECIMAL(14,3) DEFAULT 0,
    commission_amount DECIMAL(14,3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(salesperson_id, year, month)
);

-- Create indexes
CREATE INDEX idx_vendors_division ON vendors(division_id);
CREATE INDEX idx_vendors_category ON vendors(category_id);
CREATE INDEX idx_vendors_status ON vendors(status_id);
CREATE INDEX idx_vendors_search ON vendors USING GIN(search_vector);

CREATE INDEX idx_customers_division ON customers(division_id);
CREATE INDEX idx_customers_search ON customers USING GIN(search_vector);

CREATE INDEX idx_open_invoices_customer ON open_invoices(customer_id);
CREATE INDEX idx_open_invoices_date ON open_invoices(invoice_date);
CREATE INDEX idx_open_invoices_status ON open_invoices(status);

-- Enable row-level security
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY division_access ON divisions
    FOR ALL
    TO authenticated_users
    USING (id IN (
        SELECT division_id 
        FROM user_divisions 
        WHERE user_id = current_setting('app.user_id')::UUID
    ));

CREATE POLICY vendor_access ON vendors
    FOR ALL
    TO authenticated_users
    USING (division_id IN (
        SELECT division_id 
        FROM user_divisions 
        WHERE user_id = current_setting('app.user_id')::UUID
    ));

CREATE POLICY customer_access ON customers
    FOR ALL
    TO authenticated_users
    USING (division_id IN (
        SELECT division_id 
        FROM user_divisions 
        WHERE user_id = current_setting('app.user_id')::UUID
    ));

CREATE POLICY invoice_access ON open_invoices
    FOR ALL
    TO authenticated_users
    USING (customer_id IN (
        SELECT c.id 
        FROM customers c
        JOIN user_divisions ud ON c.division_id = ud.division_id
        WHERE ud.user_id = current_setting('app.user_id')::UUID
    ));

-- Create audit triggers
CREATE TRIGGER divisions_audit
    AFTER INSERT OR UPDATE OR DELETE ON divisions
    FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER vendors_audit
    AFTER INSERT OR UPDATE OR DELETE ON vendors
    FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER customers_audit
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit_log();

CREATE TRIGGER open_invoices_audit
    AFTER INSERT OR UPDATE OR DELETE ON open_invoices
    FOR EACH ROW EXECUTE FUNCTION audit_log();
