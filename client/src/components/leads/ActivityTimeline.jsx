import { formatDate, capitalizeFirst } from '../../utils/helpers';

function getTimelineDotClass(type) {
  switch (type) {
    case 'message_received': return 'message';
    case 'ai_analysis': return 'ai';
    case 'stage_change': return 'stage';
    case 'reply_sent': return 'reply';
    case 'field_edited': return 'edit';
    default: return 'system';
  }
}

function getTimelineLabel(type) {
  switch (type) {
    case 'message_received': return 'Message Received';
    case 'ai_analysis': return 'AI Analysis';
    case 'stage_change': return 'Stage Changed';
    case 'reply_sent': return 'Reply Sent';
    case 'field_edited': return 'Field Edited';
    case 'lead_created': return 'Lead Created';
    case 'note_added': return 'Note Added';
    default: return capitalizeFirst(type);
  }
}

function renderContent(activity) {
  const { type, content, actor } = activity;

  switch (type) {
    case 'message_received':
      return (
        <div>
          <span className="text-sm text-muted" style={{ marginBottom: 4, display: 'block' }}>
            {actor === 'customer' ? 'Customer' : 'Salesperson'} via {capitalizeFirst(content.channel || '')}
          </span>
          <div className="timeline-text">{content.text}</div>
        </div>
      );

    case 'ai_analysis':
      return (
        <div className="text-sm">
          <span className="text-muted">Intent: </span>
          <strong>{capitalizeFirst(content.intent)}</strong>
          {content.products?.length > 0 && (
            <>
              <span className="text-muted"> · Products: </span>
              <strong>{content.products.join(', ')}</strong>
            </>
          )}
          {content.quantity && (
            <>
              <span className="text-muted"> · Qty: </span>
              <strong>{content.quantity}</strong>
            </>
          )}
          <br />
          <span className="text-muted">
            Provider: {content.provider === 'gemini' ? '🤖 Gemini AI' : '🔧 Mock AI'}
            {content.confidence && ` · Confidence: ${capitalizeFirst(content.confidence)}`}
          </span>
        </div>
      );

    case 'stage_change':
      return (
        <div className="timeline-text">
          <span className={`badge badge-stage-${content.from}`} style={{ marginRight: 8 }}>
            {capitalizeFirst(content.from)}
          </span>
          →
          <span className={`badge badge-stage-${content.to}`} style={{ marginLeft: 8 }}>
            {capitalizeFirst(content.to)}
          </span>
          {content.reason && (
            <div className="text-muted text-sm" style={{ marginTop: 4 }}>
              {content.reason}
            </div>
          )}
        </div>
      );

    case 'reply_sent':
      return (
        <div>
          <span className="text-sm text-muted" style={{ marginBottom: 4, display: 'block' }}>
            Sent via {capitalizeFirst(content.channel || '')}
          </span>
          <div className="timeline-text">{content.text}</div>
        </div>
      );

    case 'field_edited':
      if (content.fields) {
        return (
          <div className="text-sm">
            {content.fields.map((change, i) => (
              <div key={i}>
                <span className="text-muted">{capitalizeFirst(change.field)}: </span>
                <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                  {Array.isArray(change.from) ? change.from.join(', ') : String(change.from)}
                </span>
                {' → '}
                <strong>{Array.isArray(change.to) ? change.to.join(', ') : String(change.to)}</strong>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="text-sm">
          <span className="text-muted">{capitalizeFirst(content.field)}: </span>
          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{content.from}</span>
          {' → '}
          <strong>{content.to}</strong>
        </div>
      );

    case 'lead_created':
      return (
        <div className="text-sm text-muted">
          Lead created from {capitalizeFirst(content.channel)} message
        </div>
      );

    default:
      return (
        <div className="timeline-text">
          {typeof content === 'string' ? content : JSON.stringify(content)}
        </div>
      );
  }
}

export default function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return <div className="text-muted text-sm">No activity recorded yet.</div>;
  }

  // Show newest first
  const sorted = [...activities].reverse();

  return (
    <div className="timeline">
      {sorted.map((activity, i) => (
        <div className="timeline-item" key={i} style={{ animationDelay: `${i * 50}ms` }}>
          <div className={`timeline-dot ${getTimelineDotClass(activity.type)}`} />
          <div className="timeline-content">
            <div className="timeline-meta">
              <span className="timeline-type">{getTimelineLabel(activity.type)}</span>
              <span className="timeline-time">{formatDate(activity.timestamp)}</span>
            </div>
            {renderContent(activity)}
          </div>
        </div>
      ))}
    </div>
  );
}
