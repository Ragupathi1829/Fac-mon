import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { machineApi, telemetryApi, alertApi } from '../services/api';
import type { Machine, TelemetryLog, Alert } from '../types/machine';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  RUNNING: { color: '#10b981', label: 'Running' },
  IDLE:    { color: '#f59e0b', label: 'Idle' },
  STOPPED: { color: '#64748b', label: 'Stopped' },
  ERROR:   { color: '#f43f5e', label: 'Error' },
};

const MachineDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [history, setHistory] = useState<TelemetryLog[]>([]);
  const [machineAlerts, setMachineAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'alerts'>('telemetry');

  const machineId = Number(id);

  useEffect(() => {
    if (!machineId) return;
    setLoading(true);

    const found = state.machines.find(m => m.id === machineId);
    if (found) setMachine(found);

    Promise.all([
      found ? Promise.resolve(found) : machineApi.getById(machineId),
      telemetryApi.getLatestByMachine(machineId, 50),
      alertApi.getByMachine(machineId),
    ]).then(([mach, tHistory, alerts]) => {
      setMachine(mach as Machine);
      setHistory((tHistory as TelemetryLog[]).reverse());
      setMachineAlerts(alerts as Alert[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, [machineId]);

  // Merge live WebSocket history from global state
  const liveHistory = state.telemetryHistory[machineId] ?? [];
  const chartData = liveHistory.length > 0 ? liveHistory : history;

  const chartFormatted = chartData.map(t => ({
    time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    temperature: t.temperature,
    vibration:   t.vibration,
    pressure:    t.pressure,
    power:       t.powerConsumption,
  }));

  const latest = state.latestTelemetry[machineId] ?? history[history.length - 1];
  const cfg = machine ? (STATUS_CONFIG[machine.status] ?? STATUS_CONFIG.IDLE) : STATUS_CONFIG.IDLE;

  if (loading && !machine) {
    return (
      <div className="detail-loading">
        <div className="spinner" />
        <p>Loading machine data…</p>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="detail-loading">
        <p>Machine not found.</p>
        <button className="btn-back" onClick={() => navigate('/')}>← Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="detail-container">
      {/* Back */}
      <button className="btn-back" onClick={() => navigate('/')}>
        ← Back to Dashboard
      </button>

      {/* Machine Header */}
      <div className="detail-header">
        <div>
          <span className="detail-code">{machine.machineCode}</span>
          <h1 className="detail-title">{machine.name}</h1>
          <div className="detail-meta">
            <span className="machine-meta-tag">{machine.type}</span>
            <span>📍 {machine.location}</span>
          </div>
        </div>
        <div className="machine-status-badge large" style={{ color: cfg.color, border: `1px solid ${cfg.color}40`, background: `${cfg.color}18` }}>
          <span className="status-dot" style={{ background: cfg.color, boxShadow: machine.status === 'RUNNING' ? `0 0 8px ${cfg.color}` : 'none' }} />
          {cfg.label}
        </div>
      </div>

      {/* Live Snapshot Cards */}
      {latest && (
        <div className="detail-snapshot-grid">
          {[
            { label: 'Temperature',   value: latest.temperature,       unit: '°C',   warning: 75, critical: 90  },
            { label: 'Vibration',     value: latest.vibration,         unit: 'mm/s', warning: 6,  critical: 8.5 },
            { label: 'Pressure',      value: latest.pressure,          unit: 'bar',  warning: 8,  critical: 9.5 },
            { label: 'Power Draw',    value: latest.powerConsumption,  unit: 'kW',   warning: 80, critical: 95  },
          ].map(({ label, value, unit, warning, critical }) => {
            const isCrit = value >= critical;
            const isWarn = !isCrit && value >= warning;
            const color = isCrit ? '#f43f5e' : isWarn ? '#f59e0b' : '#10b981';
            return (
              <div key={label} className="snapshot-card">
                <span className="snapshot-label">{label}</span>
                <span className="snapshot-value" style={{ color }}>
                  {value.toFixed(2)}<span className="snapshot-unit">{unit}</span>
                </span>
                {isCrit && <span className="snapshot-alert critical">CRITICAL</span>}
                {isWarn && <span className="snapshot-alert warning">WARNING</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="detail-tabs">
        <button className={`detail-tab ${activeTab === 'telemetry' ? 'active' : ''}`} onClick={() => setActiveTab('telemetry')}>
          📈 Telemetry History
        </button>
        <button className={`detail-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          🚨 Alerts ({machineAlerts.filter(a => !a.resolved).length} active)
        </button>
      </div>

      {/* Telemetry Charts */}
      {activeTab === 'telemetry' && (
        <div className="detail-charts">
          {chartFormatted.length === 0 ? (
            <div className="chart-empty">No telemetry data yet. Start the machine to collect data.</div>
          ) : (
            <>
              <div className="chart-card">
                <h3>Temperature & Vibration</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartFormatted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#f43f5e" strokeWidth={2} dot={false} name="Temp (°C)" />
                    <Line type="monotone" dataKey="vibration"   stroke="#f59e0b" strokeWidth={2} dot={false} name="Vibration (mm/s)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3>Pressure & Power Consumption</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartFormatted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#131a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="pressure" stroke="#06b6d4"  strokeWidth={2} dot={false} name="Pressure (bar)" />
                    <Line type="monotone" dataKey="power"    stroke="#10b981"  strokeWidth={2} dot={false} name="Power (kW)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="detail-alerts-list">
          {machineAlerts.length === 0 ? (
            <div className="chart-empty">✅ No alerts for this machine.</div>
          ) : (
            machineAlerts.map(alert => (
              <div
                key={alert.id}
                className={`alert-item ${alert.resolved ? 'alert-resolved' : ''}`}
                style={{
                  borderLeft: `3px solid ${alert.resolved ? '#334155' : alert.severity === 'CRITICAL' ? '#f43f5e' : alert.severity === 'WARNING' ? '#f59e0b' : '#06b6d4'}`,
                  marginBottom: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: alert.resolved ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <div className="alert-item-header">
                  <span style={{ color: alert.severity === 'CRITICAL' ? '#f43f5e' : alert.severity === 'WARNING' ? '#f59e0b' : '#06b6d4', fontWeight: 600, fontSize: '0.8rem' }}>
                    {alert.severity}
                  </span>
                  <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                  {alert.resolved && <span className="alert-resolved-tag">Resolved</span>}
                </div>
                <p className="alert-message">{alert.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MachineDetailView;
