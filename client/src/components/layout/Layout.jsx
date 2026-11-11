import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Inbox, BarChart3, Building2, Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return 'W';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon" style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <span className="sidebar-brand-text" style={{ fontSize: '0.95rem' }}>Worth Prime</span>
              <span className="sidebar-brand-sub" style={{ color: '#818cf8', fontWeight: 600 }}>Global CRM</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="sidebar-nav-label">Workspace</span>

            <NavLink
              to="/inbox"
              className={({ isActive }) =>
                `sidebar-link ${isActive || location.pathname.startsWith('/leads/') ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Inbox size={20} className="sidebar-link-icon" />
              Lead Inbox
            </NavLink>

            <NavLink
              to="/analytics"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <BarChart3 size={20} className="sidebar-link-icon" />
              Analytics
            </NavLink>
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        {user && (
          <div style={{
            padding: '16px',
            margin: '12px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {getInitials(user.name)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user.name}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  color: user.role === 'admin' ? '#818cf8' : '#34d399',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}>
                  <ShieldCheck size={11} />
                  {user.role === 'admin' ? 'Executive Admin' : 'Sales Advisor'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#fca5a5';
              }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
