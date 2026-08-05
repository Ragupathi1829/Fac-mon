import React, { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { alertApi } from '../services/api';
import type { Alert } from '../types/machine';

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: '🔴', label: 'Critical' },
  WARNING:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🟡', label: 'Warning' },
  INFO:     { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  icon: '🔵', label: 'Info' },
};

const AlertCenter: React.FC = () => {
  const { state, dispatch } = useApp();
  const [resolving, setResolving] = React.useState<number | null>(null);

  const loadAlerts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'alertsLoading', value: true } });
    try {
      const alerts = await alertApi.getRecent(50);
      dispatch({ type: 'SET_ALERTS', payload: alerts });
    } catch (err) {
      console.error('Failed to load alerts:', err);
      dispatch({ type: 'SET_LOADING', payload: { key: 'alertsLoading', value: false } });
    }
  }, [dispatch]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleResolve = async (alert: Alert) => {
    if (alert.resolved || resolving === alert.id) return;
    setResolving(alert.id);
    try {
      const resolved = await alertApi.resolve(alert.id);
      dispatch({ type: 'RESOLVE_ALERT', payload: resolved });
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolving(null);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const activeAlerts = state.alerts.filter(a => !a.resolved);
  const recentAlerts = state.alerts.slice(0, 25);

  return (
    <div className="alert-center">
      <div className="alert-center-header">
        <h2>Alert Center</h2>
        <span className={`alert-badge ${activeAlerts.length > 0 ? 'alert-badge-active' : ''}`}>
          {activeAlerts.length} active
        </span>
      </div>

      <div className="alert-list">
        {state.alertsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="alert-item skeleton-alert" />
          ))
        ) : recentAlerts.length === 0 ? (
          <div className="alert-item empty-state">
            <p>✅ No alerts — all systems nominal.</p>
          </div>
        ) : (
          recentAlerts.map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.INFO;
            return (
              <div
                key={alert.id}
                className={`alert-item ${alert.resolved ? 'alert-resolved' : ''}`}
                style={{ borderLeft: `3px solid ${alert.resolved ? '#334155' : cfg.color}`, background: alert.resolved ? 'transparent' : cfg.bg }}
              >
                <div className="alert-item-header">
                  <span className="alert-severity-icon">{cfg.icon}</span>
                  <div className="alert-item-info">
                    <span className="alert-machine">{alert.machineCode} — {alert.machineName}</span>
                    <span className="alert-time">{formatTime(alert.timestamp)}</span>
                  </div>
                  {!alert.resolved && (
                    <button
                      className="alert-resolve-btn"
                      onClick={() => handleResolve(alert)}
                      disabled={resolving === alert.id}
                      title="Resolve alert"
                    >
                      {resolving === alert.id ? '…' : '✓'}
                    </button>
                  )}
                  {alert.resolved && <span className="alert-resolved-tag">Resolved</span>}
                </div>
                <p className="alert-message">{alert.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertCenter;
