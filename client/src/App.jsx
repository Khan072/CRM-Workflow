import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/layout/Layout';
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
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<LeadInbox addToast={addToast} />} />
          <Route path="/leads/:id" element={<LeadDetail addToast={addToast} />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
      <ToastContainer toasts={toasts} />
    </BrowserRouter>
  );
}
