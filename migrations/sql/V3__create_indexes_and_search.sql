-- Create indexes for vendors
CREATE INDEX idx_vendors_division_id ON accounts_payable.vendors(division_id);
CREATE INDEX idx_vendors_category_id ON accounts_payable.vendors(category_id);
CREATE INDEX idx_vendors_status ON accounts_payable.vendors(status);

-- Add full text search for vendors
ALTER TABLE accounts_payable.vendors 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(vendor_code, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'C')
) STORED;

CREATE INDEX idx_vendors_search ON accounts_payable.vendors USING GIN (search_vector);
