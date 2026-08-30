import { useState } from 'react';
import { MessageSquarePlus, Send } from 'lucide-react';

export default function AddMessageForm({ onSubmit }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    await onSubmit(message);
    setMessage('');
    setSubmitting(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <MessageSquarePlus size={18} className="card-title-icon" />
          Add Follow-up Message
        </span>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          className="form-textarea"
          placeholder="Simulate a follow-up message from the customer..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          id="followup-message-input"
        />
        <button
          type="submit"
          className="btn btn-secondary btn-sm mt-sm"
          disabled={submitting || !message.trim()}
          id="add-followup-btn"
        >
          {submitting ? (
            <>
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
              Re-analyzing...
            </>
          ) : (
            <>
              <Send size={14} />
              Add & Re-analyze
            </>
          )}
        </button>
      </form>
    </div>
  );
}
