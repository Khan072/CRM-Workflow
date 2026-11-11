import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Inbox as InboxIcon, Globe } from 'lucide-react';
import { api } from '../services/api';
import { getInitials, timeAgo, capitalizeFirst } from '../utils/helpers';
import NewMessageModal from '../components/leads/NewMessageModal';

function renderChannelIcon(channel) {
  switch (channel) {
    case 'whatsapp':
      return <MessageSquare size={10} />;
    case 'instagram':
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case 'website':
      return <Globe size={10} />;
    default:
      return <MessageSquare size={10} />;
  }
}

export default function LeadInbox({ addToast }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [filters, setFilters] = useState({ stage: '', priority: '', channel: '', search: '' });

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getLeads(filters);
      setLeads(result.data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, addToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleNewLeadCreated = (lead, isDuplicate) => {
    setShowNewMessage(false);
    addToast(
      isDuplicate
        ? `Message added to existing lead: ${lead.customerName}`
        : `New lead created: ${lead.customerName}`,
      'success'
    );
    fetchLeads();
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Lead Inbox</h1>
            <p>Manage incoming WhatsApp, Instagram, Facebook & Website leads</p>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setShowNewMessage(true)}
            id="new-message-btn"
          >
            <Plus size={18} />
            New Message
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search leads..."
            style={{ paddingLeft: 36 }}
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            id="search-input"
          />
        </div>

        <select
          className="form-select"
          value={filters.stage}
          onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}
          id="filter-stage"
        >
          <option value="">All Stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <select
          className="form-select"
          value={filters.priority}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          id="filter-priority"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="form-select"
          value={filters.channel}
          onChange={(e) => setFilters((f) => ({ ...f, channel: e.target.value }))}
          id="filter-channel"
        >
          <option value="">All Channels</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="website">Website</option>
        </select>
      </div>

      {/* Lead List */}
      {loading ? (
        <div className="loading-overlay">
          <div className="spinner spinner-lg"></div>
          <span>Loading leads...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <InboxIcon size={64} className="empty-state-icon" />
          <h3>No leads found</h3>
          <p>
            {filters.stage || filters.priority || filters.channel || filters.search
              ? 'Try adjusting your filters to see more results.'
              : 'Click "New Message" to simulate an incoming customer message.'}
          </p>
        </div>
      ) : (
        <div className="lead-list">
          {leads.map((lead, i) => (
            <Link
              to={`/leads/${lead._id}`}
              key={lead._id}
              className="lead-card"
              style={{ animationDelay: `${i * 50}ms` }}
              id={`lead-card-${lead._id}`}
            >
              <div className="lead-card-avatar">{getInitials(lead.customerName)}</div>
              <div className="lead-card-body">
                <div className="lead-card-top">
                  <span className="lead-card-name">{lead.customerName}</span>
                  <span className="lead-card-time">{timeAgo(lead.createdAt)}</span>
                </div>
                <div className="lead-card-message">{lead.originalMessage}</div>
                <div className="lead-card-tags">
                  <span className={`badge badge-channel-${lead.channel}`}>
                    {renderChannelIcon(lead.channel)}
                    {capitalizeFirst(lead.channel)}
                  </span>
                  <span className={`badge badge-stage-${lead.stage}`}>
                    {capitalizeFirst(lead.stage)}
                  </span>
                  <span className={`badge badge-priority-${lead.priority}`}>
                    {capitalizeFirst(lead.priority)}
                  </span>
                  <span className="lead-card-score">Score: {lead.leadScore}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onCreated={handleNewLeadCreated}
          addToast={addToast}
        />
      )}
    </>
  );
}
