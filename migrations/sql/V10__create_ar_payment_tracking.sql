-- Create payment methods table
CREATE TABLE accounts_receivable.payment_methods (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    method_code varchar(10) NOT NULL UNIQUE,
    description varchar(50) NOT NULL,
    is_electronic boolean DEFAULT false,
    requires_validation boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create payments table
CREATE TABLE accounts_receivable.payments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id uuid REFERENCES accounts_receivable.customers(id),
    payment_method_id uuid REFERENCES accounts_receivable.payment_methods(id),
    payment_date timestamp with time zone NOT NULL,
    amount decimal(14,3) NOT NULL,
    reference_number varchar(50),
    status varchar(2) CHECK (status IN ('PE', 'CL', 'RJ', 'VD')), -- Pending, Cleared, Rejected, Voided
    currency_code varchar(3) DEFAULT 'USD',
    exchange_rate decimal(14,6) DEFAULT 1,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create payment allocations table
CREATE TABLE accounts_receivable.payment_allocations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id uuid REFERENCES accounts_receivable.payments(id),
    invoice_id uuid REFERENCES accounts_receivable.invoices(id),
    amount decimal(14,3) NOT NULL,
    discount_taken decimal(14,3) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL,
    UNIQUE(payment_id, invoice_id)
);
