import { NavLink, useLocation } from 'react-router-dom';
import { Inbox, BarChart3, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Zap size={20} />
          </div>
          <div>
            <span className="sidebar-brand-text">LeadFlow</span>
            <span className="sidebar-brand-sub">AI-Powered CRM</span>
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
