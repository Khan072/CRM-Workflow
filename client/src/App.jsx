import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import LeadInbox from './pages/LeadInbox';
import LeadDetail from './pages/LeadDetail';
import Analytics from './pages/Analytics';
import ToastContainer from './components/ui/ToastContainer';

export default function App() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected CRM Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/inbox" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <Layout>
                  <LeadInbox addToast={addToast} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <LeadDetail addToast={addToast} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Routes>

        <ToastContainer toasts={toasts} />
      </AuthProvider>
    </BrowserRouter>
  );
}
