-- Create customer categories table
CREATE TABLE accounts_receivable.customer_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_code varchar(9) NOT NULL UNIQUE,
    description varchar(30) NOT NULL,
    discount_percentage decimal(5,2) DEFAULT 0,
    credit_limit_default decimal(14,3),
    payment_terms_id uuid REFERENCES accounts_receivable.payment_terms(id),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create customer contacts table
CREATE TABLE accounts_receivable.customer_contacts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id uuid REFERENCES accounts_receivable.customers(id),
    contact_type varchar(20) NOT NULL,
    name varchar(50) NOT NULL,
    position varchar(30),
    phone varchar(14),
    email varchar(255),
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL,
    UNIQUE(customer_id, email)
);

-- Add foreign key to customers table for category
ALTER TABLE accounts_receivable.customers 
ADD CONSTRAINT fk_customers_category 
FOREIGN KEY (category_id) 
REFERENCES accounts_receivable.customer_categories(id);
