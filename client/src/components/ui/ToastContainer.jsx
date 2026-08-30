import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function ToastContainer({ toasts }) {
  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />,
    error: <XCircle size={18} style={{ color: 'var(--color-danger)' }} />,
    info: <Info size={18} style={{ color: 'var(--color-info)' }} />,
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {iconMap[toast.type]}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
