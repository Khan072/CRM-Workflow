import { useState, useEffect } from 'react';
import { X, MessageSquare, Send, AlertTriangle, Globe } from 'lucide-react';
import { api } from '../../services/api';

export default function NewMessageModal({ onClose, onCreated, addToast }) {
  const [form, setForm] = useState({
    customerName: '',
    customerContact: '',
    channel: 'whatsapp',
    messageText: '',
  });
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Debounced duplicate check when contact changes
  useEffect(() => {
    if (!form.customerContact || form.customerContact.length < 3) {
      setDuplicate(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setCheckingDuplicate(true);
        const result = await api.checkDuplicate({
          customerContact: form.customerContact,
          customerName: form.customerName,
          channel: form.channel,
        });
        setDuplicate(result.data);
      } catch {
        // Silently ignore duplicate check errors
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [form.customerContact, form.customerName, form.channel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.messageText.trim()) return;

    try {
      setLoading(true);
      const result = await api.createLead(form);
      onCreated(result.data, result.isDuplicate);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            <MessageSquare size={20} style={{ marginRight: 8, color: 'var(--accent-primary)' }} />
            Incoming Message
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Channel Selector */}
            <div className="form-group">
              <label className="form-label">Channel</label>
              <div className="channel-selector">
                <button
                  type="button"
                  className={`channel-btn ${form.channel === 'whatsapp' ? 'active-whatsapp' : ''}`}
                  onClick={() => handleChange('channel', 'whatsapp')}
                  id="channel-whatsapp"
                >
                  <MessageSquare size={16} />
                  WhatsApp
                </button>
                <button
                  type="button"
                  className={`channel-btn ${form.channel === 'instagram' ? 'active-instagram' : ''}`}
                  onClick={() => handleChange('channel', 'instagram')}
                  id="channel-instagram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </button>
                <button
                  type="button"
                  className={`channel-btn ${form.channel === 'facebook' ? 'active-facebook' : ''}`}
                  onClick={() => handleChange('channel', 'facebook')}
                  id="channel-facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
                <button
                  type="button"
                  className={`channel-btn ${form.channel === 'website' ? 'active-website' : ''}`}
                  onClick={() => handleChange('channel', 'website')}
                  id="channel-website"
                >
                  <Globe size={16} />
                  Website
                </button>
              </div>
            </div>

            {/* Customer Name */}
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={form.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                required
                id="customer-name-input"
              />
            </div>

            {/* Customer Contact */}
            <div className="form-group">
              <label className="form-label">Contact (Phone / Email)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +91-9876543210 or email@example.com"
                value={form.customerContact}
                onChange={(e) => handleChange('customerContact', e.target.value)}
                id="customer-contact-input"
              />
              {checkingDuplicate && (
                <span className="text-muted text-sm mt-sm" style={{ display: 'block' }}>
                  Checking for duplicates...
                </span>
              )}
            </div>

            {/* Duplicate Warning */}
            {duplicate && duplicate.hasDuplicate && (
              <div className="duplicate-warning">
                <AlertTriangle size={20} className="duplicate-warning-icon" />
                <div className="duplicate-warning-text">
                  <strong>Existing lead found!</strong>
                  <br />
                  A lead for <strong>{duplicate.exactMatch.customerName}</strong> already exists
                  (stage: {duplicate.exactMatch.stage}). Submitting will add this message to the
                  existing lead instead of creating a new one.
                </div>
              </div>
            )}

            {/* Message */}
            <div className="form-group">
              <label className="form-label">Message *</label>
              <textarea
                className="form-textarea"
                placeholder="Type or paste the customer's message here..."
                value={form.messageText}
                onChange={(e) => handleChange('messageText', e.target.value)}
                required
                rows={5}
                id="message-text-input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !form.customerName.trim() || !form.messageText.trim()}
              id="submit-message-btn"
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  {duplicate?.hasDuplicate ? 'Add to Existing Lead' : 'Create Lead'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
