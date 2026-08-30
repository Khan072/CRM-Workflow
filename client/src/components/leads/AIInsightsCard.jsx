import { useState } from 'react';
import { Sparkles, Edit3, Check, X } from 'lucide-react';
import { capitalizeFirst, INTENT_LABELS } from '../../utils/helpers';

export default function AIInsightsCard({ aiAnalysis, isOverridden, onUpdate }) {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!aiAnalysis) return null;

  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(Array.isArray(currentValue) ? currentValue.join(', ') : currentValue || '');
  };

  const saveEdit = () => {
    if (editingField) {
      let value = editValue;
      if (['products', 'keyRequirements'].includes(editingField)) {
        value = editValue.split(',').map((s) => s.trim()).filter(Boolean);
      }
      onUpdate({ [editingField]: value });
      setEditingField(null);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderField = (field, label, value, displayValue) => {
    const isEditing = editingField === field;

    return (
      <div className="ai-insight-item ai-insight-editable" key={field}>
        <div className="ai-insight-label">{label}</div>
        {isEditing ? (
          <div className="flex items-center gap-xs">
            <input
              type="text"
              className="form-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
              style={{ fontSize: 'var(--font-sm)' }}
            />
            <button className="btn btn-ghost btn-sm" onClick={saveEdit} aria-label="Save">
              <Check size={14} style={{ color: 'var(--color-success)' }} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={cancelEdit} aria-label="Cancel">
              <X size={14} style={{ color: 'var(--color-danger)' }} />
            </button>
          </div>
        ) : (
          <>
            <div className="ai-insight-value">{displayValue || value || '—'}</div>
            <button
              className="btn btn-ghost btn-sm ai-insight-edit-btn"
              onClick={() => startEdit(field, value)}
              aria-label={`Edit ${label}`}
            >
              <Edit3 size={12} />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Sparkles size={18} className="card-title-icon" />
          AI Insights
        </span>
        <div className="flex items-center gap-sm">
          {isOverridden && (
            <span className="badge badge-edited">
              <Edit3 size={10} />
              Manually Edited
            </span>
          )}
          <div className="confidence-indicator">
            <span className={`confidence-dot ${aiAnalysis.confidence}`}></span>
            <span className="text-sm text-muted">
              {capitalizeFirst(aiAnalysis.confidence)} confidence
            </span>
          </div>
        </div>
      </div>

      <div className="ai-insight-grid">
        {renderField(
          'intent',
          'Intent',
          aiAnalysis.intent,
          <span className="tag">{INTENT_LABELS[aiAnalysis.intent] || capitalizeFirst(aiAnalysis.intent)}</span>
        )}

        {renderField(
          'urgency',
          'Urgency',
          aiAnalysis.urgency,
          <span>
            <span className={`badge badge-priority-${aiAnalysis.urgency}`}>
              {capitalizeFirst(aiAnalysis.urgency)}
            </span>
            {aiAnalysis.urgencyReason && (
              <span className="text-sm text-muted" style={{ marginLeft: 8 }}>
                {aiAnalysis.urgencyReason}
              </span>
            )}
          </span>
        )}

        {renderField(
          'products',
          'Products / Services',
          aiAnalysis.products,
          aiAnalysis.products?.length > 0 ? (
            <div>
              {aiAnalysis.products.map((p, i) => (
                <span className="tag" key={i}>{p}</span>
              ))}
            </div>
          ) : (
            <span className="text-muted">Not specified</span>
          )
        )}

        {renderField(
          'quantity',
          'Quantity',
          aiAnalysis.quantity,
          aiAnalysis.quantity || <span className="text-muted">Not mentioned</span>
        )}

        {renderField(
          'keyRequirements',
          'Key Requirements',
          aiAnalysis.keyRequirements,
          <div className="full-width">
            {aiAnalysis.keyRequirements?.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                {aiAnalysis.keyRequirements.map((req, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>{req}</li>
                ))}
              </ul>
            ) : (
              <span className="text-muted">None extracted</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
