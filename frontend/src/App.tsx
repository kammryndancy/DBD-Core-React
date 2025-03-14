import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import { theme } from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ValidationSchemas from './pages/validation/ValidationSchemas';
import ValidationRules from './pages/validation/ValidationRules';
import ValidationAudit from './pages/validation/ValidationAudit';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/validation/schemas" element={<ValidationSchemas />} />
              <Route path="/validation/rules" element={<ValidationRules />} />
              <Route path="/validation/audit" element={<ValidationAudit />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
