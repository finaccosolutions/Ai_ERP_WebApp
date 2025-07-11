import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { AIProvider } from './contexts/AIContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Sales from './pages/Sales/Sales';
import Purchase from './pages/Purchase/Purchase';
import Accounting from './pages/Accounting/Accounting';
import Inventory from './pages/Inventory/Inventory';
import Manufacturing from './pages/Manufacturing/Manufacturing';
import Reports from './pages/Reports/Reports';
import Compliance from './pages/Compliance/Compliance';
import HR from './pages/HR/HR';
import CRM from './pages/CRM/CRM';
import Admin from './pages/Admin/Admin';
import { useAuth } from './hooks/useAuth';
import CompanySetup from './pages/Company/CompanySetup';
import CompanySettings from './pages/Company/CompanySettings';
import { useCompany } from './contexts/CompanyContext';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { companies, currentCompany } = useCompany();

  if (!isAuthenticated) {
    return <Login />;
  }

  // If user has no companies, show company setup
  if (companies.length === 0) {
    return <CompanySetup />;
  }

  // If no company is selected, show company selector
  if (!currentCompany) {
    return <CompanySetup />;
  }
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/company/setup" element={<CompanySetup />} />
        <Route path="/company/settings" element={<CompanySettings />} />
        <Route path="/sales/*" element={<Sales />} />
        <Route path="/purchase/*" element={<Purchase />} />
        <Route path="/accounting/*" element={<Accounting />} />
        <Route path="/inventory/*" element={<Inventory />} />
        <Route path="/manufacturing/*" element={<Manufacturing />} />
        <Route path="/reports/*" element={<Reports />} />
        <Route path="/compliance/*" element={<Compliance />} />
        <Route path="/hr/*" element={<HR />} />
        <Route path="/crm/*" element={<CRM />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <AIProvider>
              <AppContent />
            </AIProvider>
          </CompanyProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;