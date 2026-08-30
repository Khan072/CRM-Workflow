import { Target } from 'lucide-react';
import { SCORE_FACTOR_LABELS, SCORE_FACTOR_MAX } from '../../utils/helpers';

export default function LeadScoreCard({ score, breakdown }) {
  // SVG circle math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Target size={18} className="card-title-icon" />
          Lead Score
        </span>
      </div>

      <div className="score-gauge">
        {/* Score circle */}
        <div className="score-circle">
          <svg viewBox="0 0 120 120">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={radius} className="score-circle-bg" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="score-circle-fill"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="score-circle-value">
            <span className="score-number">{score}</span>
            <span className="score-label">/ 100</span>
          </div>
        </div>

        {/* Score breakdown */}
        {breakdown && (
          <div className="score-breakdown">
            {Object.entries(breakdown).map(([key, value]) => {
              const max = SCORE_FACTOR_MAX[key] || 20;
              const pct = Math.round((value / max) * 100);
              return (
                <div className="score-factor" key={key}>
                  <span className="score-factor-name">
                    {SCORE_FACTOR_LABELS[key] || key}
                  </span>
                  <div className="score-factor-bar">
                    <div
                      className="score-factor-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="score-factor-value">
                    {value}/{max}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
