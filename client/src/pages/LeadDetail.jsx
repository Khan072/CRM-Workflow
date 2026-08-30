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
                  <MessageSquare size={10} />
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
