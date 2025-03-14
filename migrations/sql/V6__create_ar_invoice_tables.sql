-- Create invoices table
CREATE TABLE accounts_receivable.invoices (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id uuid REFERENCES accounts_receivable.customers(id),
    invoice_number varchar(10) NOT NULL UNIQUE,
    invoice_date timestamp with time zone NOT NULL,
    due_date timestamp with time zone NOT NULL,
    terms_id uuid REFERENCES accounts_receivable.payment_terms(id),
    status varchar(1) CHECK (status IN ('O', 'P', 'C')), -- Open, Partial, Closed
    total_amount decimal(14,3) NOT NULL,
    paid_amount decimal(14,3) DEFAULT 0,
    balance_amount decimal(14,3) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    discount_amount decimal(14,3) DEFAULT 0,
    tax_amount decimal(14,3) DEFAULT 0,
    freight_amount decimal(14,3) DEFAULT 0,
    currency_code varchar(3) DEFAULT 'USD',
    exchange_rate decimal(14,6) DEFAULT 1,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create invoice items table
CREATE TABLE accounts_receivable.invoice_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id uuid REFERENCES accounts_receivable.invoices(id),
    line_number integer NOT NULL,
    product_code varchar(20),
    description varchar(100),
    quantity decimal(14,3) NOT NULL,
    unit_price decimal(14,3) NOT NULL,
    discount_percent decimal(5,2) DEFAULT 0,
    tax_code_id uuid REFERENCES accounts_receivable.sales_tax(id),
    amount decimal(14,3) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_percent/100)) STORED,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL,
    UNIQUE(invoice_id, line_number)
);
