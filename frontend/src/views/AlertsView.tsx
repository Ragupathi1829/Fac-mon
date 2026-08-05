import React from 'react';
import Navbar from '../components/Navbar';
import ActivityTicker from '../components/ActivityTicker';
import AlertCenter from '../components/AlertCenter';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WsMessage } from '../types/machine';

const AlertsView: React.FC = () => {
  const { state, dispatch, handleWsMessage } = useApp();

  const handleMessage = React.useCallback((msg: WsMessage) => {
    handleWsMessage(msg);
  }, [handleWsMessage]);

  const handleConnectionChange = React.useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  }, [dispatch]);

  useWebSocket(handleMessage, handleConnectionChange);

  const totalAlerts = state.alerts.length;
  const activeAlerts = state.alerts.filter(a => !a.resolved).length;
  const criticalCount = state.alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length;
  const warningCount = state.alerts.filter(a => a.severity === 'WARNING' && !a.resolved).length;
  const infoCount = state.alerts.filter(a => a.severity === 'INFO' && !a.resolved).length;

  return (
    <div className="app-root">
      <Navbar />
      <ActivityTicker />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>🚨 Alerts</h1>
          <p className="system-time">PULSE · Alert Monitoring Center</p>
        </header>

        {/* Alert Stats */}
        <div className="kpi-panel" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="kpi-card kpi-card-cyan">
            <div className="kpi-card-icon" style={{ background: 'rgba(0,212,255,0.08)' }}>📊</div>
            <div className="kpi-card-body">
              <h3>Active Alerts</h3>
              <p className="kpi-value">{activeAlerts}</p>
              <p className="kpi-sub">of {totalAlerts} total</p>
            </div>
          </div>
          <div className="kpi-card kpi-card-rose">
            <div className="kpi-card-icon" style={{ background: 'rgba(255,59,106,0.08)' }}>🔴</div>
            <div className="kpi-card-body">
              <h3>Critical</h3>
              <p className="kpi-value" style={{ color: '#ff3b6a' }}>{criticalCount}</p>
            </div>
          </div>
          <div className="kpi-card kpi-card-amber">
            <div className="kpi-card-icon" style={{ background: 'rgba(255,176,32,0.08)' }}>🟡</div>
            <div className="kpi-card-body">
              <h3>Warning</h3>
              <p className="kpi-value" style={{ color: '#ffb020' }}>{warningCount}</p>
            </div>
          </div>
          <div className="kpi-card kpi-card-blue">
            <div className="kpi-card-icon" style={{ background: 'rgba(0,212,255,0.08)' }}>🔵</div>
            <div className="kpi-card-body">
              <h3>Info</h3>
              <p className="kpi-value" style={{ color: '#00d4ff' }}>{infoCount}</p>
            </div>
          </div>
        </div>

        <main className="dashboard-main">
          <div className="alerts-full-view">
            <AlertCenter />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AlertsView;
