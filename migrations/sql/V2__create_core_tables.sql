-- Create divisions table
CREATE TABLE accounts_payable.divisions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_code varchar(2) NOT NULL UNIQUE,
    description varchar(30) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create vendor categories table
CREATE TABLE accounts_payable.vendor_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_code varchar(9) NOT NULL UNIQUE,
    description varchar(30) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL
);

-- Create vendors table
CREATE TABLE accounts_payable.vendors (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    division_id uuid REFERENCES accounts_payable.divisions(id),
    vendor_code varchar(8) NOT NULL,
    name varchar(35) NOT NULL,
    address_line1 varchar(30),
    address_line2 varchar(30),
    city varchar(16),
    state varchar(2),
    zip_code varchar(9),
    phone varchar(14),
    fax varchar(12),
    contact_person varchar(20),
    email varchar(255),
    web_address varchar(255),
    status varchar(1) DEFAULT 'A' CHECK (status IN ('A', 'I')),
    category_id uuid REFERENCES accounts_payable.vendor_categories(id),
    terms_code varchar(2),
    tax_id varchar(14),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL,
    UNIQUE(division_id, vendor_code)
);
