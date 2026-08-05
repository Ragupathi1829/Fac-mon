import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { machineApi, telemetryApi, alertApi } from '../services/api';
import type { Machine, EnrichedTelemetryLog, Alert } from '../types/machine';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  RUNNING: { color: '#00e68a', label: 'Running' },
  IDLE:    { color: '#ffb020', label: 'Idle' },
  STOPPED: { color: '#64748b', label: 'Stopped' },
  ERROR:   { color: '#ff3b6a', label: 'Error' },
};

const MachineDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [history, setHistory] = useState<EnrichedTelemetryLog[]>([]);
  const [machineAlerts, setMachineAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'alerts' | 'ai'>('telemetry');
  const [showQrModal, setShowQrModal] = useState(false);

  const machineId = Number(id);

  const loadData = () => {
    Promise.all([
      machineApi.getById(machineId),
      telemetryApi.getLatestByMachine(machineId, 50),
      alertApi.getByMachine(machineId),
    ]).then(([mach, tHistory, alerts]) => {
      setMachine(mach as Machine);
      setHistory((tHistory as EnrichedTelemetryLog[]).reverse());
      setMachineAlerts(alerts as Alert[]);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!machineId) return;
    setLoading(true);
    loadData();
  }, [machineId]);

  // Merge live WebSocket history from global state
  const liveHistory = state.telemetryHistory[machineId] ?? [];
  const chartData = liveHistory.length > 0 ? liveHistory : history;

  const chartFormatted = chartData.map(t => ({
    time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    temperature: t.temperature,
    vibration:   t.vibration,
    pressure:    t.pressure,
    power:       t.powerConsumption,
    voltage:     t.voltage || 220,
    rpm:         t.rpm || 1500,
    motorLoad:   t.motorLoad || 50,
  }));

  const latest = state.latestTelemetry[machineId] || history[history.length - 1];
  const cfg = machine ? (STATUS_CONFIG[machine.status] ?? STATUS_CONFIG.IDLE) : STATUS_CONFIG.IDLE;

  const handleStatusChange = async (status: string) => {
    if (!machine) return;
    try {
      const updated = await machineApi.updateStatus(machine.id, status);
      setMachine(updated);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleExportCsv = () => {
    const headers = 'Timestamp,Temperature(C),Vibration(mm/s),Pressure(bar),Power(kW),Voltage(V),RPM,Motor Load(%),Health(%)\n';
    const rows = chartData.map(t => 
      `${t.timestamp},${t.temperature},${t.vibration},${t.pressure},${t.powerConsumption},${t.voltage || 220},${t.rpm || 1500},${t.motorLoad || 50},${t.healthScore || 100}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Telemetry_History_Machine_${machine?.machineCode || machineId}.csv`);
    a.click();
  };

  if (loading && !machine) {
    return (
      <div className="detail-loading">
        <div className="spinner" />
        <p>Loading machine diagnostics…</p>
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
      {/* Back & Actions Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-add-machine" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', borderColor: 'rgba(255,255,255,0.08)' }} onClick={() => setShowQrModal(true)}>
            📱 Scan QR Code
          </button>
          <button className="btn-add-machine" onClick={handleExportCsv}>
            📥 Export telemetry CSV
          </button>
        </div>
      </div>

      {/* Machine Header & Controls */}
      <div className="detail-header">
        <div>
          <span className="detail-code">{machine.machineCode}</span>
          <h1 className="detail-title">{machine.name}</h1>
          <div className="detail-meta">
            <span className="machine-meta-tag">{machine.type}</span>
            <span>📍 {machine.location}</span>
            <span>• Shift Operator: {state.workers.find(w => w.assignedMachineId === machine.id)?.name || 'None Assigned'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Controls switcher for Operators and Engineers */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {machine.status !== 'RUNNING' && (
              <button className="filter-tab" style={{ background: 'rgba(0,230,138,0.1)', color: '#00e68a', border: 'none' }} onClick={() => handleStatusChange('RUNNING')}>
                ▶ Start
              </button>
            )}
            {machine.status === 'RUNNING' && (
              <button className="filter-tab" style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: 'none' }} onClick={() => handleStatusChange('STOPPED')}>
                ⏸ Stop
              </button>
            )}
            <button className="filter-tab" style={{ background: 'rgba(255,59,106,0.1)', color: '#ff3b6a', border: 'none' }} onClick={() => handleStatusChange('ERROR')}>
              ⚠️ Test Fault
            </button>
          </div>

          <div className="machine-status-badge large" style={{ color: cfg.color, border: `1px solid ${cfg.color}40`, background: `${cfg.color}18` }}>
            <span className="status-dot" style={{ background: cfg.color, boxShadow: machine.status === 'RUNNING' ? `0 0 8px ${cfg.color}` : 'none' }} />
            {cfg.label}
          </div>
        </div>
      </div>

      {/* Live Snapshot Cards (12 Sensors) */}
      {latest && (
        <div className="detail-snapshot-grid">
          {[
            { label: 'Temperature',   value: latest.temperature,       unit: '°C',   warning: 75, critical: 90  },
            { label: 'Vibration',     value: latest.vibration,         unit: 'mm/s', warning: 6,  critical: 8.5 },
            { label: 'Pressure',      value: latest.pressure,          unit: 'bar',  warning: 8,  critical: 9.5 },
            { label: 'Power Draw',    value: latest.powerConsumption,  unit: 'kW',   warning: 80, critical: 95  },
            { label: 'Voltage',       value: latest.voltage || 220.4,  unit: 'V',    warning: 240, critical: 250 },
            { label: 'Current',       value: latest.current || 12.8,   unit: 'A',    warning: 45, critical: 55 },
            { label: 'Motor speed',   value: latest.rpm || 1720,       unit: 'RPM',  warning: 2200, critical: 2400 },
            { label: 'Motor Load',    value: latest.motorLoad || 62.4, unit: '%',    warning: 80, critical: 95 },
          ].map(({ label, value, unit, warning, critical }) => {
            const isCrit = value >= critical;
            const isWarn = !isCrit && value >= warning;
            const color = isCrit ? '#ff3b6a' : isWarn ? '#ffb020' : '#00e68a';
            return (
              <div key={label} className="snapshot-card">
                <span className="snapshot-label">{label}</span>
                <span className="snapshot-value" style={{ color }}>
                  {value.toFixed(1)}<span className="snapshot-unit">{unit}</span>
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
          📈 Telemetry Charts
        </button>
        <button className={`detail-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          🚨 Alerts ({machineAlerts.filter(a => !a.resolved).length} active)
        </button>
        <button className={`detail-tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          🧠 AI Predictive Insights
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
                <h3>Temperature & Motor Speed</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartFormatted}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff3b6a" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ff3b6a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fill: '#8b9dc3', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#8b9dc3', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend />
                    <Area type="monotone" dataKey="temperature" stroke="#ff3b6a" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" name="Temp (°C)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3>Pressure & Vibration</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartFormatted}>
                    <defs>
                      <linearGradient id="colorPress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" tick={{ fill: '#8b9dc3', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#8b9dc3', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend />
                    <Area type="monotone" dataKey="pressure" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorPress)" name="Pressure (bar)" />
                  </AreaChart>
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
                  borderLeft: `3px solid ${alert.resolved ? '#334155' : alert.severity === 'CRITICAL' ? '#ff3b6a' : alert.severity === 'WARNING' ? '#ffb020' : '#00d4ff'}`,
                  marginBottom: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: alert.resolved ? 'rgba(255,255,255,0.02)' : 'rgba(255,59,106,0.05)',
                }}
              >
                <div className="alert-item-header">
                  <span style={{ color: alert.severity === 'CRITICAL' ? '#ff3b6a' : alert.severity === 'WARNING' ? '#ffb020' : '#00d4ff', fontWeight: 700, fontSize: '0.8rem' }}>
                    {alert.severity}
                  </span>
                  <span className="alert-time">{new Date(alert.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                  {alert.resolved && <span className="alert-resolved-tag">Resolved</span>}
                </div>
                <p className="alert-message">{alert.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Tab */}
      {activeTab === 'ai' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
          {/* Health circular card */}
          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Machine Health Index</h4>
            
            <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '1rem' }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle 
                  cx="18" cy="18" r="15" fill="none" 
                  stroke={latest?.healthScore && latest.healthScore > 80 ? '#00e68a' : '#ffb020'} 
                  strokeWidth="3" 
                  strokeDasharray={`${2 * Math.PI * 15}`} 
                  strokeDashoffset={`${2 * Math.PI * 15 * (1 - (latest?.healthScore || 100) / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 900, color: '#f0f4f8' }}>{latest?.healthScore || 100}%</span>
              </div>
            </div>
            
            <span style={{
              color: latest?.healthScore && latest.healthScore > 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
              fontWeight: 800, fontSize: '0.88rem'
            }}>
              {latest?.healthScore && latest.healthScore > 80 ? 'Excellent Condition' : 'Warning: Degraded Efficiency'}
            </span>
          </div>

          {/* AI predictions metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="chart-card">
              <h4 style={{ color: '#f0f4f8', marginBottom: '0.5rem' }}>🔮 AI Predictive Failure Forecast</h4>
              {latest?.predictedFailureProb ? (
                <div>
                  <p style={{ color: 'var(--accent-rose)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    ⚠️ {latest.predictedFailureProb}% Bearing Wear Failure Probability
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    Expected critical wear shutdown forecast: <span style={{ color: '#ffb020', fontWeight: 'bold' }}>Within {latest.predictedFailureTime} hours</span>.
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--accent-emerald)', fontSize: '0.83rem', fontWeight: 600 }}>
                  ✅ No predictive maintenance flags. Component wear values are well below baseline warning parameters.
                </p>
              )}
            </div>

            <div className="chart-card">
              <h4 style={{ color: '#f0f4f8', marginBottom: '0.5rem' }}>💡 Smart Recommendation Engine</h4>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--accent-cyan)', padding: '0.85rem 1.1rem', borderRadius: '4px' }}>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.83rem', lineHeight: 1.5 }}>
                  {latest?.aiRecommendation || 'No action items required. Continue scheduled preventive operational guidelines.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal Simulation */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="modal-header">
              <h2>Smart QR Integration</h2>
              <button className="modal-close" onClick={() => setShowQrModal(false)}>✕</button>
            </div>
            
            <div style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' }}>
              {/* Dummy representation of a QR Code */}
              <svg width="140" height="140" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#fff" />
                <rect x="5" y="5" width="25" height="25" fill="#000" />
                <rect x="10" y="10" width="15" height="15" fill="#fff" />
                <rect x="70" y="5" width="25" height="25" fill="#000" />
                <rect x="75" y="10" width="15" height="15" fill="#fff" />
                <rect x="5" y="70" width="25" height="25" fill="#000" />
                <rect x="10" y="75" width="15" height="15" fill="#fff" />
                <rect x="35" y="35" width="30" height="30" fill="#000" />
                <rect x="40" y="40" width="20" height="20" fill="#fff" />
              </svg>
            </div>
            
            <h4 style={{ color: '#f0f4f8', marginBottom: '0.5rem' }}>{machine.name} Code</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '1.5rem' }}>Scan this QR code with a mobile scanner to open telemetry logs, download user manual, or submit a maintenance workorder on the spot.</p>
            
            <button className="btn-submit" onClick={() => alert('Print command triggered for this machine tag.')}>
              🖨️ Print Label
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineDetailView;
