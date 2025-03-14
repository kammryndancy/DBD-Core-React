import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Vendors from './Vendors';
import VendorDetails from './VendorDetails';
import Invoices from './Invoices';
import InvoiceDetails from './InvoiceDetails';
import Validation from './Validation';

const APModule: React.FC & {
  Vendors: typeof Vendors;
  VendorDetails: typeof VendorDetails;
  Invoices: typeof Invoices;
  InvoiceDetails: typeof InvoiceDetails;
  Validation: typeof Validation;
} = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="vendors" replace />} />
      <Route path="vendors" element={<Vendors />} />
      <Route path="vendors/:id" element={<VendorDetails />} />
      <Route path="invoices" element={<Invoices />} />
      <Route path="invoices/:id" element={<InvoiceDetails />} />
      <Route path="validation" element={<Validation />} />
    </Routes>
  );
};

// Attach components for route configuration
APModule.Vendors = Vendors;
APModule.VendorDetails = VendorDetails;
APModule.Invoices = Invoices;
APModule.InvoiceDetails = InvoiceDetails;
APModule.Validation = Validation;

export default APModule;
