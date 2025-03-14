import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Customers from './Customers';
import CustomerDetails from './CustomerDetails';
import Invoices from './Invoices';
import InvoiceDetails from './InvoiceDetails';
import Validation from './Validation';

const ARModule: React.FC & {
  Customers: typeof Customers;
  CustomerDetails: typeof CustomerDetails;
  Invoices: typeof Invoices;
  InvoiceDetails: typeof InvoiceDetails;
  Validation: typeof Validation;
} = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="customers" replace />} />
      <Route path="customers" element={<Customers />} />
      <Route path="customers/:id" element={<CustomerDetails />} />
      <Route path="invoices" element={<Invoices />} />
      <Route path="invoices/:id" element={<InvoiceDetails />} />
      <Route path="validation" element={<Validation />} />
    </Routes>
  );
};

// Attach components for route configuration
ARModule.Customers = Customers;
ARModule.CustomerDetails = CustomerDetails;
ARModule.Invoices = Invoices;
ARModule.InvoiceDetails = InvoiceDetails;
ARModule.Validation = Validation;

export default ARModule;
