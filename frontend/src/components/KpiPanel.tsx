import React, { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { dashboardApi } from '../services/api';

// SVG Icon components for a cleaner, premium look
const GearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const AlertIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const KpiPanel: React.FC = () => {
  const { state, dispatch } = useApp();

  const loadKpi = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'kpiLoading', value: true } });
    try {
      const kpi = await dashboardApi.getKpi();
      dispatch({ type: 'SET_KPI', payload: kpi as any });
    } catch (err) {
      console.error('Failed to load KPI:', err);
      dispatch({ type: 'SET_LOADING', payload: { key: 'kpiLoading', value: false } });
    }
  }, [dispatch]);

  useEffect(() => {
    loadKpi();
    // Refresh KPI every 15 seconds
    const interval = setInterval(loadKpi, 15000);
    return () => clearInterval(interval);
  }, [loadKpi]);

  const kpi = state.kpi;

  return (
    <div className="kpi-panel">
      {/* Active Machines */}
      <div className="kpi-card kpi-card-cyan">
        <div className="kpi-card-icon" style={{ color: '#00d4ff' }}>
          <GearIcon />
        </div>
        <div className="kpi-card-body">
          <h3>Active Machines</h3>
          {state.kpiLoading ? (
            <p className="kpi-value skeleton-text">—</p>
          ) : (
            <p className="kpi-value">
              <span className="kpi-highlight">{kpi?.runningMachines ?? 0}</span>
              <span className="kpi-divider"> / {kpi?.totalMachines ?? 0}</span>
            </p>
          )}
          <div className="kpi-sub-row">
            <span className="kpi-sub idle">Idle: {kpi?.idleMachines ?? 0}</span>
            <span className="kpi-sub stopped">Stopped: {kpi?.stoppedMachines ?? 0}</span>
          </div>
        </div>
      </div>

      {/* OEE */}
      <div className="kpi-card kpi-card-emerald">
        <div className="kpi-card-icon" style={{ color: '#00e68a' }}>
          <ChartIcon />
        </div>
        <div className="kpi-card-body">
          <h3>Overall OEE</h3>
          {state.kpiLoading ? (
            <p className="kpi-value skeleton-text">—</p>
          ) : (
            <p className="kpi-value">
              <span className="kpi-highlight">{kpi?.oeePercent?.toFixed(1) ?? '--'}</span>
              <span className="kpi-unit"> %</span>
            </p>
          )}
          <div className="oee-bar-track">
            <div className="oee-bar-fill" style={{ width: `${kpi?.oeePercent ?? 0}%` }} />
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className={`kpi-card ${(kpi?.criticalAlerts ?? 0) > 0 ? 'kpi-card-rose' : 'kpi-card-amber'}`}>
        <div className="kpi-card-icon" style={{ color: (kpi?.criticalAlerts ?? 0) > 0 ? '#ff3b6a' : '#ffb020' }}>
          <AlertIcon />
        </div>
        <div className="kpi-card-body">
          <h3>Active Alerts</h3>
          {state.kpiLoading ? (
            <p className="kpi-value skeleton-text">—</p>
          ) : (
            <p className="kpi-value">
              <span className="kpi-highlight">{kpi?.activeAlerts ?? 0}</span>
            </p>
          )}
          <div className="kpi-sub-row">
            <span className="kpi-sub critical">Critical: {kpi?.criticalAlerts ?? 0}</span>
            <span className="kpi-sub warning">Warning: {kpi?.warningAlerts ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Machine Errors */}
      <div className="kpi-card kpi-card-blue">
        <div className="kpi-card-icon" style={{ color: '#3b82f6' }}>
          <ShieldIcon />
        </div>
        <div className="kpi-card-body">
          <h3>Machines in Error</h3>
          {state.kpiLoading ? (
            <p className="kpi-value skeleton-text">—</p>
          ) : (
            <p className="kpi-value">
              <span className="kpi-highlight">{kpi?.errorMachines ?? 0}</span>
              <span className="kpi-unit"> machines</span>
            </p>
          )}
          <p className="kpi-sub">{kpi?.errorMachines === 0 ? '✅ All systems nominal' : '⚠️ Requires attention'}</p>
        </div>
      </div>
    </div>
  );
};

export default KpiPanel;
