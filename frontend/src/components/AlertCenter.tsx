import React, { useEffect, useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import { alertApi } from '../services/api';
import type { Alert } from '../types/machine';

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#ff3b6a', bg: 'rgba(255,59,106,0.08)', icon: '🔴', label: 'Critical' },
  WARNING:  { color: '#ffb020', bg: 'rgba(255,176,32,0.08)',  icon: '🟡', label: 'Warning' },
  INFO:     { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',  icon: '🔵', label: 'Info' },
};

const AlertCenter: React.FC = () => {
  const { state, dispatch } = useApp();
  const [resolving, setResolving] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [soundEnabled, setSoundEnabled] = useState(false);

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

  // Sound notification trigger when new critical alert arrives
  useEffect(() => {
    const activeCritical = state.alerts.some(a => a.severity === 'CRITICAL' && !a.resolved);
    if (activeCritical && soundEnabled) {
      // Simulate/Trigger simple beep if browser permits
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.value = 520;
        gain.gain.setValueAtTime(0.04, context.currentTime);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start();
        osc.stop(context.currentTime + 0.15);
      } catch (e) {
        console.log('Audio contextual trigger suppressed by policy');
      }
    }
  }, [state.alerts, soundEnabled]);

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

  const handleResolveAll = () => {
    dispatch({ type: 'RESOLVE_ALL_ALERTS' });
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const activeAlerts = state.alerts.filter(a => !a.resolved);
  const resolvedAlerts = state.alerts.filter(a => a.resolved);
  const listToRender = activeTab === 'ACTIVE' ? activeAlerts : resolvedAlerts;

  return (
    <div className="alert-center">
      <div className="alert-center-header">
        <h2>Alert Center</h2>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }} 
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Disable Notification Sounds' : 'Enable Notification Sounds'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <span className={`alert-badge ${activeAlerts.length > 0 ? 'alert-badge-active' : ''}`}>
            {activeAlerts.length} active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
        <button 
          className="filter-tab" 
          style={{ padding: '0.2rem 0.5rem', background: activeTab === 'ACTIVE' ? 'rgba(255,59,106,0.1)' : 'transparent', color: activeTab === 'ACTIVE' ? 'var(--accent-rose)' : 'var(--text-muted)', border: 'none' }}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Active
        </button>
        <button 
          className="filter-tab" 
          style={{ padding: '0.2rem 0.5rem', background: activeTab === 'RESOLVED' ? 'rgba(255,255,255,0.04)' : 'transparent', color: activeTab === 'RESOLVED' ? 'var(--text-primary)' : 'var(--text-muted)', border: 'none' }}
          onClick={() => setActiveTab('RESOLVED')}
        >
          Resolved ({resolvedAlerts.length})
        </button>
        
        {activeAlerts.length > 0 && activeTab === 'ACTIVE' && (
          <button 
            className="filter-tab" 
            style={{ marginLeft: 'auto', padding: '0.2rem 0.5rem', background: 'rgba(0,230,138,0.1)', color: 'var(--accent-emerald)', border: 'none' }}
            onClick={handleResolveAll}
          >
            ✓ Resolve All
          </button>
        )}
      </div>

      <div className="alert-list">
        {state.alertsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="alert-item skeleton-alert" />
          ))
        ) : listToRender.length === 0 ? (
          <div className="alert-item empty-state">
            <p>{activeTab === 'ACTIVE' ? '✅ No active alerts — all systems nominal.' : 'No resolved alert history.'}</p>
          </div>
        ) : (
          listToRender.map(alert => {
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
