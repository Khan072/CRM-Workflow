import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';
import { api } from '../services/api';
import { capitalizeFirst } from '../utils/helpers';

const STAGE_COLORS = {
  new: '#64748b',
  contacted: '#3b82f6',
  qualified: '#8b5cf6',
  proposal: '#f59e0b',
  won: '#10b981',
  lost: '#ef4444',
};

const PRIORITY_COLORS = {
  low: '#22d3ee',
  medium: '#f59e0b',
  high: '#f43f5e',
};

const CHANNEL_COLORS = {
  whatsapp: '#25d366',
  instagram: '#e1306c',
  facebook: '#1877f2',
  website: '#0ea5e9',
};

function BarChart({ data, labelKey, valueKey, colorMap, maxValue }) {
  const max = maxValue || Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <div className="chart-bar-container">
      {data.map((item) => {
        const pct = Math.round((item[valueKey] / max) * 100);
        const color = colorMap[item[labelKey]] || 'var(--accent-primary)';
        return (
          <div className="chart-bar-row" key={item[labelKey]}>
            <span className="chart-bar-label">{capitalizeFirst(item[labelKey])}</span>
            <div className="chart-bar-track">
              <div
                className="chart-bar-fill"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                }}
              >
                <span className="chart-bar-value">{item[valueKey]}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await api.getAnalytics();
        setData(result.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner spinner-lg"></div>
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <BarChart3 size={64} className="empty-state-icon" />
        <h3>No data available</h3>
        <p>Create some leads to see analytics.</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Lead pipeline overview and performance metrics</p>
      </div>

      {/* Summary Stats */}
      <div className="analytics-grid">
        <div className="card analytics-stat">
          <div className="analytics-stat-value">{data.total}</div>
          <div className="analytics-stat-label">
            <Users size={14} style={{ marginRight: 4 }} />
            Total Leads
          </div>
        </div>
        <div className="card analytics-stat">
          <div className="analytics-stat-value">{data.avgScore}</div>
          <div className="analytics-stat-label">
            <Target size={14} style={{ marginRight: 4 }} />
            Avg Score
          </div>
        </div>
        <div className="card analytics-stat">
          <div className="analytics-stat-value">
            {data.byPriority.find((p) => p.priority === 'high')?.count || 0}
          </div>
          <div className="analytics-stat-label">
            <TrendingUp size={14} style={{ marginRight: 4 }} />
            High Priority
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Leads by Stage</span>
          </div>
          <BarChart
            data={data.byStage}
            labelKey="stage"
            valueKey="count"
            colorMap={STAGE_COLORS}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Leads by Priority</span>
          </div>
          <BarChart
            data={data.byPriority}
            labelKey="priority"
            valueKey="count"
            colorMap={PRIORITY_COLORS}
          />
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Leads by Channel</span>
          </div>
          <BarChart
            data={data.byChannel}
            labelKey="channel"
            valueKey="count"
            colorMap={CHANNEL_COLORS}
          />
        </div>
      </div>
    </>
  );
}
