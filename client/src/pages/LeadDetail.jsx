import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  Sparkles,
  Edit3,
  Check,
  X,
  Globe,
} from 'lucide-react';
import { api } from '../services/api';
import { getInitials, capitalizeFirst, formatDate } from '../utils/helpers';
import AIInsightsCard from '../components/leads/AIInsightsCard';
import LeadScoreCard from '../components/leads/LeadScoreCard';
import StageSelector from '../components/leads/StageSelector';
import NextActionCard from '../components/leads/NextActionCard';
import SuggestedReplyCard from '../components/leads/SuggestedReplyCard';
import ActivityTimeline from '../components/leads/ActivityTimeline';
import AddMessageForm from '../components/leads/AddMessageForm';

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

export default function LeadDetail({ addToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getLead(id);
      setLead(result.data);
    } catch (err) {
      addToast(err.message, 'error');
      navigate('/inbox');
    } finally {
      setLoading(false);
    }
  }, [id, addToast, navigate]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleStageChange = async (newStage) => {
    try {
      const result = await api.updateLead(id, { stage: newStage });
      setLead(result.data);
      addToast(`Stage updated to ${capitalizeFirst(newStage)}`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      const result = await api.updateLead(id, { priority: newPriority });
      setLead(result.data);
      addToast(`Priority updated to ${capitalizeFirst(newPriority)}`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAIFieldUpdate = async (updates) => {
    try {
      const result = await api.updateLead(id, { aiAnalysis: updates });
      setLead(result.data);
      addToast('AI insights updated', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSendReply = async (replyText) => {
    try {
      const result = await api.sendReply(id, replyText);
      setLead(result.data);
      addToast('Reply sent successfully', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddMessage = async (messageText) => {
    try {
      const result = await api.addMessage(id, { messageText, sender: 'customer' });
      setLead(result.data);
      addToast('Follow-up message added & re-analyzed', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner spinner-lg"></div>
        <span>Loading lead details...</span>
      </div>
    );
  }

  if (!lead) return null;

  const contactIcon = lead.customerContact?.includes('@') ? (
    <Mail size={14} />
  ) : (
    <Phone size={14} />
  );

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/inbox')}
          style={{ marginBottom: 'var(--space-md)' }}
          id="back-to-inbox"
        >
          <ArrowLeft size={18} />
          Back to Inbox
        </button>

        <div className="lead-detail-header">
          <div className="lead-detail-info">
            <div className="lead-detail-avatar">{getInitials(lead.customerName)}</div>
            <div>
              <h1 className="lead-detail-name">{lead.customerName}</h1>
              <div className="lead-detail-contact">
                <span className={`badge badge-channel-${lead.channel}`}>
                  {renderChannelIcon(lead.channel)}
                  {capitalizeFirst(lead.channel)}
                </span>
                {lead.customerContact && (
                  <span className="flex items-center gap-xs text-muted">
                    {contactIcon}
                    {lead.customerContact}
                  </span>
                )}
                <span className="text-muted text-sm">
                  Created {formatDate(lead.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-sm">
            <span className={`badge badge-priority-${lead.priority}`}>
              {capitalizeFirst(lead.priority)} Priority
            </span>
            {lead.isAiOverridden && (
              <span className="badge badge-edited">
                <Edit3 size={10} />
                Edited
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <StageSelector currentStage={lead.stage} onStageChange={handleStageChange} />
      </div>

      {/* Main Layout */}
      <div className="lead-detail-layout">
        {/* Left Column — Main Content */}
        <div className="lead-detail-main">
          {/* Original Message */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <MessageSquare size={18} className="card-title-icon" />
                Original Message
              </span>
              <span className="text-muted text-sm">{formatDate(lead.createdAt)}</span>
            </div>
            <div className="original-message">{lead.originalMessage}</div>
          </div>

          {/* AI Insights */}
          <AIInsightsCard
            aiAnalysis={lead.aiAnalysis}
            isOverridden={lead.isAiOverridden}
            onUpdate={handleAIFieldUpdate}
          />

          {/* Next Action */}
          <NextActionCard nextAction={lead.aiAnalysis?.nextAction} />

          {/* Suggested Reply */}
          <SuggestedReplyCard
            suggestedReply={lead.aiAnalysis?.suggestedReply}
            onSend={handleSendReply}
          />

          {/* Add Follow-up Message */}
          <AddMessageForm onSubmit={handleAddMessage} />

          {/* Activity Timeline */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                Activity History
              </span>
            </div>
            <ActivityTimeline activities={lead.activities || []} />
          </div>
        </div>

        {/* Right Column — Sidebar */}
        <div className="lead-detail-sidebar">
          {/* Lead Score */}
          <LeadScoreCard
            score={lead.leadScore}
            breakdown={lead.scoreBreakdown}
          />

          {/* Priority Override */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Priority</span>
            </div>
            <div className="flex gap-sm">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  className={`btn btn-sm ${lead.priority === p ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handlePriorityChange(p)}
                  id={`priority-${p}`}
                >
                  {capitalizeFirst(p)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
