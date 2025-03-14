-- Create customers table
CREATE TABLE accounts_receivable.customers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id uuid REFERENCES accounts_payable.divisions(id),
    customer_code varchar(8) NOT NULL,
    name varchar(35) NOT NULL,
    address_line1 varchar(30),
    address_line2 varchar(30),
    city varchar(16),
    state varchar(2),
    zip_code varchar(9),
    phone varchar(14),
    fax varchar(12),
    email varchar(255),
    web_address varchar(255),
    credit_limit decimal(14,3),
    status varchar(1) DEFAULT 'A' CHECK (status IN ('A', 'I')),
    category_id uuid,
    terms_code varchar(2),
    tax_id varchar(14),
    credit_contact varchar(20),
    credit_contact_email varchar(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL,
    UNIQUE(division_id, customer_code)
);

-- Create payment terms table
CREATE TABLE accounts_receivable.payment_terms (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    terms_code varchar(2) NOT NULL UNIQUE,
    description varchar(30) NOT NULL,
    terms_type varchar(1) CHECK (terms_type IN ('P', 'E', 'N', 'D')),
    days_until_due integer,
    days_in_period smallint,
    cutoff_day smallint,
    discount_percentage decimal(14,3),
    discount_days integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create sales tax table
CREATE TABLE accounts_receivable.sales_tax (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tax_code varchar(10) NOT NULL UNIQUE,
    description varchar(25) NOT NULL,
    rate decimal(14,3) NOT NULL,
    state varchar(2),
    county varchar(30),
    city varchar(30),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);
