-- Indexes for customer contacts
CREATE INDEX idx_customer_contacts_customer_id ON accounts_receivable.customer_contacts(customer_id);
CREATE INDEX idx_customer_contacts_email ON accounts_receivable.customer_contacts(email);
CREATE INDEX idx_customer_contacts_is_primary ON accounts_receivable.customer_contacts(is_primary);

-- Indexes for payments
CREATE INDEX idx_payments_customer_id ON accounts_receivable.payments(customer_id);
CREATE INDEX idx_payments_payment_date ON accounts_receivable.payments(payment_date);
CREATE INDEX idx_payments_status ON accounts_receivable.payments(status);
CREATE INDEX idx_payments_reference_number ON accounts_receivable.payments(reference_number);

-- Indexes for payment allocations
CREATE INDEX idx_payment_allocations_payment_id ON accounts_receivable.payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice_id ON accounts_receivable.payment_allocations(invoice_id);

-- Indexes for sales representatives
CREATE INDEX idx_sales_representatives_territory_id ON accounts_receivable.sales_representatives(territory_id);
CREATE INDEX idx_sales_representatives_status ON accounts_receivable.sales_representatives(status);

-- Indexes for sales statistics
CREATE INDEX idx_sales_statistics_rep_id ON accounts_receivable.sales_statistics(rep_id);
CREATE INDEX idx_sales_statistics_customer_id ON accounts_receivable.sales_statistics(customer_id);
CREATE INDEX idx_sales_statistics_year_month ON accounts_receivable.sales_statistics(year, month);
