// Legacy Data Types
export const LEGACY_DATA_TYPES = {
  CHAR: 'VARCHAR',
  NUMBER: 'DECIMAL',
  DATE: 'TIMESTAMP WITH TIME ZONE'
} as const;

export type LegacyDataType = keyof typeof LEGACY_DATA_TYPES;
export type TargetDataType = typeof LEGACY_DATA_TYPES[LegacyDataType];

// AP Module Types
export interface APState {
  vendors: APVendor[];
  invoices: APInvoice[];
  loading: boolean;
  error: string | null;
}

export interface APVendor {
  id: string;
  divisionId: string;
  vendorNumber: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  status: string;
  category: string;
  paymentTerms: string;
  taxId?: string;
  is1099Vendor: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface APInvoice {
  id: string;
  divisionId: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  description: string;
  status: string;
  paymentTerms: string;
  createdAt: string;
  updatedAt: string;
}

// AR Module Types
export interface ARState {
  customers: ARCustomer[];
  invoices: ARInvoice[];
  loading: boolean;
  error: string | null;
}

export interface ARCustomer {
  id: string;
  divisionId: string;
  customerNumber: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  status: string;
  paymentTerms: string;
  salesTaxCode: string;
  creditLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ARInvoice {
  id: string;
  divisionId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  description: string;
  status: string;
  paymentTerms: string;
  salesTaxAmount: number;
  createdAt: string;
  updatedAt: string;
}

// Validation Types
export interface ValidationState {
  loading: boolean;
  error: string | null;
  auditLogs: ValidationLog[];
  schemas: ValidationSchema[];
  rules: ValidationRule[];
}

export interface ValidationLog {
  id: string;
  timestamp: string;
  validationResult: boolean;
  errors?: ValidationError[];
  entityType: 'AP' | 'AR';
  entityId: string;
}

export interface ValidationError {
  field: string;
  message: string;
  legacyType: LegacyDataType;
  legacyValue: string;
  convertedValue?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationSchema {
  id: string;
  name: string;
  description: string;
  entityType: 'AP' | 'AR';
  fields: ValidationField[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationField {
  name: string;
  legacyType: LegacyDataType;
  targetType: TargetDataType;
  required: boolean;
  validations: FieldValidation[];
}

export interface FieldValidation {
  type: 'format' | 'length' | 'range' | 'custom';
  params: Record<string, unknown>;
  errorMessage: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  entityType: 'AP' | 'AR';
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Redux Store Types
export interface RootState {
  validation: ValidationState;
  ap: APState;
  ar: ARState;
}

// Redux Action Types
export type AppThunk<ReturnType = void> = (
  dispatch: (action: any) => void,
  getState: () => RootState
) => ReturnType;

export type ValidationAction = 
  | { type: 'validation/setLoading'; payload: boolean }
  | { type: 'validation/setError'; payload: string | null }
  | { type: 'validation/clearError' }
  | { type: 'validation/fetchSchemasSuccess'; payload: ValidationSchema[] }
  | { type: 'validation/fetchRulesSuccess'; payload: ValidationRule[] }
  | { type: 'validation/fetchAuditLogsSuccess'; payload: ValidationLog[] };

export type AppDispatch = typeof store.dispatch;
