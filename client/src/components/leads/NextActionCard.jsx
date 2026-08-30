import { Lightbulb } from 'lucide-react';

export default function NextActionCard({ nextAction }) {
  if (!nextAction) return null;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Lightbulb size={18} className="card-title-icon" />
          Recommended Next Action
        </span>
      </div>
      <div className="next-action-content">
        <div className="next-action-icon">
          <Lightbulb size={20} />
        </div>
        <div className="next-action-text">{nextAction}</div>
      </div>
    </div>
  );
}
