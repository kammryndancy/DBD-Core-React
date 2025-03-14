import { 
  ValidationState, 
  ValidationSchema, 
  ValidationRule, 
  ValidationLog,
  PVXDataType,
  PostgreSQLDataType,
  ValidationAction
} from '../../types';

// Initial state with proper types
const initialState: ValidationState = {
  schemas: [],
  rules: [],
  auditLogs: [],
  loading: false,
  error: null
};

// Action Creators
export const setLoading = (loading: boolean): ValidationAction => ({
  type: 'validation/setLoading',
  payload: loading
});

export const setError = (error: string | null): ValidationAction => ({
  type: 'validation/setError',
  payload: error
});

export const clearError = (): ValidationAction => ({
  type: 'validation/clearError'
});

export const fetchSchemasSuccess = (schemas: ValidationSchema[]): ValidationAction => ({
  type: 'validation/fetchSchemasSuccess',
  payload: schemas
});

export const fetchRulesSuccess = (rules: ValidationRule[]): ValidationAction => ({
  type: 'validation/fetchRulesSuccess',
  payload: rules
});

export const fetchAuditLogsSuccess = (logs: ValidationLog[]): ValidationAction => ({
  type: 'validation/fetchAuditLogsSuccess',
  payload: logs
});

// Reducer
const validationReducer = (
  state: ValidationState = initialState,
  action: ValidationAction
): ValidationState => {
  switch (action.type) {
    case 'validation/setLoading':
      return {
        ...state,
        loading: action.payload
      };
    case 'validation/setError':
      return {
        ...state,
        error: action.payload
      };
    case 'validation/clearError':
      return {
        ...state,
        error: null
      };
    case 'validation/fetchSchemasSuccess':
      return {
        ...state,
        schemas: action.payload,
        loading: false
      };
    case 'validation/fetchRulesSuccess':
      return {
        ...state,
        rules: action.payload,
        loading: false
      };
    case 'validation/fetchAuditLogsSuccess':
      return {
        ...state,
        auditLogs: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

// Data Type Mapping Constants
export const PVX_TO_POSTGRESQL_TYPE_MAP: Record<PVXDataType, PostgreSQLDataType> = {
  'CHAR': 'VARCHAR',
  'NUMBER': 'DECIMAL',
  'DATE': 'TIMESTAMP WITH TIME ZONE'
};

// Selectors
export const selectValidationSchemas = (state: ValidationState) => state.schemas;
export const selectValidationRules = (state: ValidationState) => state.rules;
export const selectValidationAuditLogs = (state: ValidationState) => state.auditLogs;
export const selectValidationLoading = (state: ValidationState) => state.loading;
export const selectValidationError = (state: ValidationState) => state.error;

export default validationReducer;
