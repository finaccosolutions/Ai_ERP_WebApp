// src/App.tsx
import React, { useState } from 'react'; // Import useState
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Import Navigate
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { AIProvider } from './contexts/AIContext';
import { NotificationProvider } from './contexts/NotificationContext';
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
import Admin from './pages/Admin/Admin'; // Admin module entry
import { useAuth } from './hooks/useAuth';
import CompanySetup from './pages/Company/CompanySetup';
import CompanySettings from './pages/Company/CompanySettings';
import CompanyManagement from './pages/Company/CompanyManagement'; // Import CompanyManagement
import { useCompany } from './contexts/CompanyContext'; // Import useCompany
import ConfirmationModal from './components/UI/ConfirmationModal'; // Import ConfirmationModal

// Import new User-related pages
import ProfilePage from './pages/User/ProfilePage';
import UserSettingsPage from './pages/User/SettingsPage';
import AIPreferencesPage from './pages/User/AIPreferencesPage';
import UserPageLayout from './components/Layout/UserPageLayout'; // Import new UserPageLayout

function AppContent() {
  console.log('AppContent rendering...');
  // Destructure the loading state from useAuth
  const { isAuthenticated, user, loading: authLoading, logout, hasPermission } = useAuth(); // Correctly destructure loading and logout
  const { companies, currentCompany, loadingCompanies } = useCompany(); // Add loadingCompanies here

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State for logout confirmation

  console.log("AppContent: isAuthenticated =", isAuthenticated);
  console.log("AppContent: Current User =", user);
  console.log("AppContent: Auth Loading =", authLoading); // This should now show true/false

  // Handle authentication loading state first
  if (authLoading) { // This check is now meaningful
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  } 
 
  // If companies are still loading, show a loading indicator
  if (loadingCompanies) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user has no companies after loading, show company setup
  if (companies.length === 0) {
    return <CompanySetup />;
  }

  // If no company is selected, show company setup (or a dedicated selection page)
  if (!currentCompany) {
    // This case should ideally be handled by redirecting to CompanyManagement
    // or a dedicated company selection page if the user has companies but none selected.
    // For now, we'll redirect to CompanyManagement to allow selection.
    return <CompanyManagement />;
  }

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false); // Close modal
    logout(); // Perform actual logout
  };

  return (
    <>
      <Layout setShowLogoutConfirm={setShowLogoutConfirm}> {/* Pass setShowLogoutConfirm to Layout */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/company/manage" element={<CompanyManagement />} />
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
          {/* Conditional Admin Route */}
          <Route 
            path="/admin/*" 
            element={hasPermission('admin_panel', 'access') ? <Admin /> : <Navigate to="/" replace />} 
          />
          {/* User-related Routes wrapped with UserPageLayout */}
          <Route path="/user/*" element={<UserPageLayout />}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<UserSettingsPage />} />
            <Route path="ai-preferences" element={<AIPreferencesPage />} />
          </Route>
        </Routes>
      </Layout>

      {/* Logout Confirmation Modal - Rendered at AppContent level */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Yes, Logout"
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <AIProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </AIProvider>
          </CompanyProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
