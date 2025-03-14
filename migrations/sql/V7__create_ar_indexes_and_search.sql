-- Customer indexes
CREATE INDEX idx_customers_division_id ON accounts_receivable.customers(division_id);
CREATE INDEX idx_customers_status ON accounts_receivable.customers(status);
CREATE INDEX idx_customers_category_id ON accounts_receivable.customers(category_id);

-- Invoice indexes
CREATE INDEX idx_invoices_customer_id ON accounts_receivable.invoices(customer_id);
CREATE INDEX idx_invoices_invoice_date ON accounts_receivable.invoices(invoice_date);
CREATE INDEX idx_invoices_status ON accounts_receivable.invoices(status);
CREATE INDEX idx_invoices_due_date ON accounts_receivable.invoices(due_date);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice_id ON accounts_receivable.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_code ON accounts_receivable.invoice_items(product_code);

-- Full text search for customers
ALTER TABLE accounts_receivable.customers 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(customer_code, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'C')
) STORED;

CREATE INDEX idx_customers_search ON accounts_receivable.customers USING GIN (search_vector);
