import React, { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { dashboardApi } from '../services/api';

const ICONS = {
  activeMachines: '⚙️',
  oee: '📊',
  alerts: '🚨',
  errors: '⚠️',
};

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
        <div className="kpi-card-icon">{ICONS.activeMachines}</div>
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
        <div className="kpi-card-icon">{ICONS.oee}</div>
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
        <div className="kpi-card-icon">{ICONS.alerts}</div>
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
        <div className="kpi-card-icon">{ICONS.errors}</div>
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
