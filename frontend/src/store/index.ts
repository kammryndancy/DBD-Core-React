import { createStore, combineReducers } from 'redux';
import { ValidationState, APState, ARState } from '../types';

// Initial state for validation
const initialValidationState: ValidationState = {
  loading: false,
  error: null,
  auditLogs: [],
  schemas: [],
  rules: []
};

// Initial state for AP module
const initialAPState: APState = {
  vendors: [],
  invoices: [],
  loading: false,
  error: null
};

// Initial state for AR module
const initialARState: ARState = {
  customers: [],
  invoices: [],
  loading: false,
  error: null
};

// Validation reducer
const validationReducer = (state = initialValidationState, action: { type: string; payload?: any }) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'SET_AUDIT_LOGS':
      return {
        ...state,
        auditLogs: action.payload
      };
    case 'SET_SCHEMAS':
      return {
        ...state,
        schemas: action.payload
      };
    case 'SET_RULES':
      return {
        ...state,
        rules: action.payload
      };
    default:
      return state;
  }
};

// AP module reducer
const apReducer = (state = initialAPState, action: { type: string; payload?: any }) => {
  switch (action.type) {
    case 'SET_AP_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_AP_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'SET_VENDORS':
      return {
        ...state,
        vendors: action.payload
      };
    case 'SET_AP_INVOICES':
      return {
        ...state,
        invoices: action.payload
      };
    default:
      return state;
  }
};

// AR module reducer
const arReducer = (state = initialARState, action: { type: string; payload?: any }) => {
  switch (action.type) {
    case 'SET_AR_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_AR_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'SET_CUSTOMERS':
      return {
        ...state,
        customers: action.payload
      };
    case 'SET_AR_INVOICES':
      return {
        ...state,
        invoices: action.payload
      };
    default:
      return state;
  }
};

// Combine reducers
const rootReducer = combineReducers({
  validation: validationReducer,
  ap: apReducer,
  ar: arReducer
});

// Create store
export const store = createStore(rootReducer);

// Export types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
