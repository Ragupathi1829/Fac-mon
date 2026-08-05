import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types/machine';

const ROLE_LABELS: Record<UserRole, string> = {
  FACTORY_OWNER: '👑 Factory Owner',
  PRODUCTION_MANAGER: '👔 Manager',
  MAINTENANCE_ENGINEER: '🔧 Engineer',
  MACHINE_OPERATOR: '👷 Operator',
  QUALITY_INSPECTOR: '🔬 Inspector',
  ADMIN: '⚡ Admin',
};

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();
  const [clock, setClock] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const activeAlerts = state.alerts.filter(a => !a.resolved).length;

  const timeStr = clock.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateStr = clock.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_ROLE', payload: e.target.value as UserRole });
  };

  const showTab = (tab: string): boolean => {
    const role = state.activeRole;
    if (tab === 'sustainability') return role === 'FACTORY_OWNER' || role === 'PRODUCTION_MANAGER' || role === 'ADMIN';
    if (tab === 'maintenance') return role === 'MAINTENANCE_ENGINEER' || role === 'PRODUCTION_MANAGER' || role === 'ADMIN';
    if (tab === 'workers') return role === 'PRODUCTION_MANAGER' || role === 'ADMIN';
    if (tab === 'documents') return role !== 'QUALITY_INSPECTOR'; // Inspector doesn't need manuals
    return true; // Dashboard, Machines, Alerts visible to all
  };

  return (
    <nav className="navbar">
      {/* ── PULSE Brand ── */}
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <svg className="navbar-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="navPulse" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00e68a" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
            <filter id="navGlow">
              <feGaussianBlur stdDeviation="1" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx="22" cy="22" r="20" fill="rgba(0,230,138,0.08)" stroke="rgba(0,230,138,0.3)" strokeWidth="1.2"/>
          <polyline
            filter="url(#navGlow)"
            points="5,22 10,22 13,14 17,30 20,18 23,26 26,22 31,22 34,17 37,22 39,22"
            stroke="url(#navPulse)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="22" cy="22" r="2.2" fill="#00e68a" filter="url(#navGlow)"/>
        </svg>

        <div className="navbar-brand-text">
          <span className="navbar-title">SmartFactory 360</span>
          <span className="navbar-subtitle">Live Analytics Suite</span>
        </div>
      </div>

      {/* ── Nav Links ── */}
      <div className="navbar-links">
        <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>
          🏭 Dashboard
        </button>
        <button className={`nav-link ${isActive('/machines') ? 'active' : ''}`} onClick={() => navigate('/machines')}>
          ⚙️ Machines
        </button>
        <button className={`nav-link ${isActive('/alerts') ? 'active' : ''}`} onClick={() => navigate('/alerts')}>
          🚨 Alerts {activeAlerts > 0 && <span className="nav-badge">{activeAlerts}</span>}
        </button>
        
        {/* Enriched tabs */}
        {showTab('sustainability') && (
          <button className={`nav-link ${isActive('/sustainability') ? 'active' : ''}`} onClick={() => navigate('/sustainability')}>
            ♻️ Sustainability
          </button>
        )}
        {showTab('maintenance') && (
          <button className={`nav-link ${isActive('/maintenance') ? 'active' : ''}`} onClick={() => navigate('/maintenance')}>
            🛠️ Maintenance
          </button>
        )}
        {showTab('workers') && (
          <button className={`nav-link ${isActive('/workers') ? 'active' : ''}`} onClick={() => navigate('/workers')}>
            👥 Workers
          </button>
        )}
        {showTab('documents') && (
          <button className={`nav-link ${isActive('/documents') ? 'active' : ''}`} onClick={() => navigate('/documents')}>
            📂 Documents
          </button>
        )}
      </div>

      {/* ── Right Side ── */}
      <div className="navbar-right">
        {/* Role Switcher */}
        <select 
          value={state.activeRole} 
          onChange={handleRoleChange}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)', padding: '0.35rem 0.6rem', borderRadius: '8px',
            fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
            fontWeight: 600
          }}
        >
          {Object.entries(ROLE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <div className={`ws-indicator ${state.isConnected ? 'connected' : 'disconnected'}`}>
          <span className="ws-dot" />
          {state.isConnected ? 'Live' : 'Offline'}
        </div>
        <div className="navbar-divider" />
        <div className="navbar-clock">
          <span className="clock-time">{timeStr}</span>
          <span className="clock-date">{dateStr}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
