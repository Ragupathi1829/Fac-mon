import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
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

  return (
    <nav className="navbar">
      {/* ── PULSE Brand ── */}
      <div className="navbar-brand" onClick={() => navigate('/')}>
        {/* Inline SVG icon — ECG pulse circle */}
        <svg className="navbar-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="navPulse" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="navGlow">
              <feGaussianBlur stdDeviation="1" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx="22" cy="22" r="20" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.2"/>
          <polyline
            filter="url(#navGlow)"
            points="5,22 10,22 13,14 17,30 20,18 23,26 26,22 31,22 34,17 37,22 39,22"
            stroke="url(#navPulse)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="22" cy="22" r="2.2" fill="#10b981" filter="url(#navGlow)"/>
        </svg>

        <div className="navbar-brand-text">
          <span className="navbar-title">PULSE</span>
          <span className="navbar-subtitle">Live Factory Analytics</span>
        </div>
      </div>

      {/* ── Nav Links ── */}
      <div className="navbar-links">
        <button
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          🏭 Dashboard
        </button>
        <button
          className={`nav-link ${isActive('/machines') ? 'active' : ''}`}
          onClick={() => navigate('/machines')}
        >
          ⚙️ Machines
        </button>
        <button
          className={`nav-link ${isActive('/alerts') ? 'active' : ''}`}
          onClick={() => navigate('/alerts')}
        >
          🚨 Alerts
          {activeAlerts > 0 && (
            <span className="nav-badge">{activeAlerts}</span>
          )}
        </button>
      </div>

      {/* ── Right Side ── */}
      <div className="navbar-right">
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
