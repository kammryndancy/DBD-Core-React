-- Create sales territories table
CREATE TABLE accounts_receivable.sales_territories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    territory_code varchar(5) NOT NULL UNIQUE,
    description varchar(30) NOT NULL,
    region varchar(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create sales representatives table
CREATE TABLE accounts_receivable.sales_representatives (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rep_code varchar(5) NOT NULL UNIQUE,
    name varchar(50) NOT NULL,
    territory_id uuid REFERENCES accounts_receivable.sales_territories(id),
    commission_rate decimal(5,2) DEFAULT 0,
    email varchar(255),
    phone varchar(14),
    status varchar(1) DEFAULT 'A' CHECK (status IN ('A', 'I')),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create sales statistics table
CREATE TABLE accounts_receivable.sales_statistics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rep_id uuid REFERENCES accounts_receivable.sales_representatives(id),
    customer_id uuid REFERENCES accounts_receivable.customers(id),
    year integer NOT NULL,
    month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
    sales_amount decimal(14,3) DEFAULT 0,
    cost_amount decimal(14,3) DEFAULT 0,
    commission_amount decimal(14,3) DEFAULT 0,
    number_of_orders integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL,
    UNIQUE(rep_id, customer_id, year, month)
);
