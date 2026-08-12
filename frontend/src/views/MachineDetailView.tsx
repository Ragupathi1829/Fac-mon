

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { machineApi, telemetryApi, alertApi } from '../services/api';
import type { Machine, EnrichedTelemetryLog, Alert } from '../types/machine';

import EditMachineModal from '../components/EditMachineModal';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  RUNNING: { color: '#00e68a', label: 'Running' },
  IDLE: { color: '#ffb020', label: 'Idle' },
  STOPPED: { color: '#64748b', label: 'Stopped' },
  ERROR: { color: '#ff3b6a', label: 'Error' },
};

const MachineDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [history, setHistory] = useState<EnrichedTelemetryLog[]>([]);
  const [machineAlerts, setMachineAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'alerts' | 'sensors' | 'ai'>('telemetry');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Attached IoT Sensors State
  const [attachedSensors, setAttachedSensors] = useState([
    { id: 1, name: 'Thermal Sensor (RTD PT100)', type: 'Temperature', model: 'TMP-PT100-PRO', status: 'ACTIVE', reading: '75.8°C' },
    { id: 2, name: 'Piezoelectric Vibration Sensor', type: 'Vibration', model: 'VIB-SENS-3D', status: 'ACTIVE', reading: '3.7 mm/s' },
    { id: 3, name: 'Smart Power & Current Transducer', type: 'Power', model: 'PWR-KW-200', status: 'ACTIVE', reading: '63.2 kW' },
    { id: 4, name: 'Digital Pressure Transmitter', type: 'Pressure', model: 'PRS-BAR-10', status: 'ACTIVE', reading: '7.4 bar' },
    { id: 5, name: 'Ambient Relative Humidity Sensor', type: 'Humidity', model: 'HUM-SENS-RH', status: 'ACTIVE', reading: '48.5%' },
  ]);
  const [newSensorType, setNewSensorType] = useState('Temperature');

  const machineId = Number(id);

  const loadData = React.useCallback(() => {
    Promise.all([
      machineApi.getById(machineId),
      telemetryApi.getLatestByMachine(machineId, 50),
      alertApi.getByMachine(machineId),
    ]).then(([mach, tHistory, alerts]) => {
      setMachine(mach as Machine | null);
      setHistory(((tHistory as EnrichedTelemetryLog[]) || []).reverse());
      setMachineAlerts((alerts as Alert[]) || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [machineId]);

  const handleDeleteMachine = async () => {
    if (!machine) return;
    if (!window.confirm(`Are you sure you want to delete ${machine.name} (${machine.machineCode})? This action cannot be undone.`)) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await machineApi.delete(machine.id);
      dispatch({ type: 'REMOVE_MACHINE', payload: machine.id });
      navigate('/machines');
    } catch (_err) {
      setDeleteError('Failed to delete machine. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddSensor = () => {
    const sensorNameMap: Record<string, string> = {
      Temperature: 'Infrared Thermal Probe',
      Vibration: 'Tri-Axial Accelerometer',
      Power: 'CT Power Meter 100A',
      Humidity: 'Capacitive Humidity Sensor',
      Pressure: 'Differential Pressure Gauge',
    };
    const newSensor = {
      id: Date.now(),
      name: sensorNameMap[newSensorType] || `${newSensorType} Sensor`,
      type: newSensorType,
      model: `IOT-${newSensorType.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'ACTIVE',
      reading: newSensorType === 'Temperature' ? '68.0°C' : newSensorType === 'Vibration' ? '2.1 mm/s' : newSensorType === 'Humidity' ? '50.0%' : '5.0 bar',
    };
    setAttachedSensors([...attachedSensors, newSensor]);
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
    vibration: t.vibration,
    pressure: t.pressure,
    power: t.powerConsumption,
    voltage: t.voltage || 220,
    rpm: t.rpm || 1500,
    motorLoad: t.motorLoad || 50,
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
        <p style={{ color: '#ff3b6a', fontWeight: 700, fontSize: '1.1rem' }}>Machine not found.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>The machine ID you requested does not exist or has been removed.</p>
        <button className="btn-back" onClick={() => navigate('/machines')} style={{ marginTop: '1rem' }}>← Back to Machines</button>
      </div>
    );
  }

  return (
    <div className="detail-container">
      {/* Back & Actions Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-back" onClick={() => navigate('/machines')}>
          ← Back to Machines
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-add-machine" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => setShowEditModal(true)}>
            ✏️ Edit Machine
          </button>
          <button className="btn-add-machine" style={{ background: 'rgba(255,59,106,0.15)', color: '#ff3b6a', borderColor: 'rgba(255,59,106,0.3)' }} onClick={handleDeleteMachine} disabled={deleting}>
            {deleting ? 'Deleting…' : '🗑️ Delete Machine'}
          </button>
          <button className="btn-add-machine" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', borderColor: 'rgba(255,255,255,0.08)' }} onClick={() => setShowQrModal(true)}>
            📱 Scan QR Code
          </button>
          <button className="btn-add-machine" onClick={handleExportCsv}>
            📥 Export telemetry CSV
          </button>
        </div>
      </div>

      {/* Inline Delete Error */}
      {deleteError && (
        <div style={{ background: 'rgba(255,59,106,0.12)', border: '1px solid rgba(255,59,106,0.4)', borderRadius: '10px', padding: '0.75rem 1rem', margin: '0.5rem 0', color: '#ff3b6a', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚠️ {deleteError}
          <button onClick={() => setDeleteError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff3b6a', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

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
            { label: 'Temperature', value: latest.temperature, unit: '°C', warning: 75, critical: 90 },
            { label: 'Vibration', value: latest.vibration, unit: 'mm/s', warning: 6, critical: 8.5 },
            { label: 'Pressure', value: latest.pressure, unit: 'bar', warning: 8, critical: 9.5 },
            { label: 'Power Draw', value: latest.powerConsumption, unit: 'kW', warning: 80, critical: 95 },
            { label: 'Voltage', value: latest.voltage || 220.4, unit: 'V', warning: 240, critical: 250 },
            { label: 'Current', value: latest.current || 12.8, unit: 'A', warning: 45, critical: 55 },
            { label: 'Motor speed', value: latest.rpm || 1720, unit: 'RPM', warning: 2200, critical: 2400 },
            { label: 'Motor Load', value: latest.motorLoad || 62.4, unit: '%', warning: 80, critical: 95 },
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
              </div>
            );
          })}
        </div>
      )}

      {/* Failure Impact & Production Loss Risk Banner */}
      <div className="chart-card" style={{ background: 'linear-gradient(135deg, rgba(255,59,106,0.1), rgba(15,23,42,0.95))', border: '1px solid rgba(255,59,106,0.3)', marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <span style={{ background: 'rgba(255,59,106,0.2)', color: '#ff3b6a', border: '1px solid rgba(255,59,106,0.4)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
              💥 PRODUCTION IMPACT DIAGNOSTIC
            </span>
            <h3 style={{ color: '#ffffff', fontSize: '1.1rem', margin: '0.4rem 0 0.2rem', fontWeight: 800 }}>
              {machine.failureImpact || 'Machine outage affects main factory line production speed.'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
              Fixed Factory Sensors Attached: <strong style={{ color: '#00d4ff' }}>{machine.fixedSensors?.map(s => s.sensorId).join(', ') || 'SNS-TMP-101A, SNS-VIB-101B'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', background: 'rgba(0,0,0,0.4)', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Production Rate Loss</span>
              <strong style={{ fontSize: '1.1rem', color: '#ff3b6a', fontWeight: 900 }}>
                {machine.productionLossRisk || '3,200 Units / Hr'}
              </strong>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Financial Outage Loss</span>
              <strong style={{ fontSize: '1.1rem', color: '#ffb020', fontWeight: 900 }}>
                {machine.financialImpactPerHr || '₹45,000 / Hr'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button className={`detail-tab ${activeTab === 'telemetry' ? 'active' : ''}`} onClick={() => setActiveTab('telemetry')}>
          📈 Telemetry Charts
        </button>
        <button className={`detail-tab ${activeTab === 'sensors' ? 'active' : ''}`} onClick={() => setActiveTab('sensors')}>
          📡 Attached Sensors ({attachedSensors.length})
        </button>
        <button className={`detail-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          🚨 Alerts ({machineAlerts.filter(a => !a.resolved).length} active)
        </button>
        <button className={`detail-tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          🧠 AI Predictive Insights
        </button>
      </div>

      {/* Sensor Management Tab */}
      {activeTab === 'sensors' && (
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ color: '#ffffff' }}>Fixed Factory IoT Sensors & Unique Transducer IDs</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                Factory-installed telemetry nodes bound with unique hardware IDs (`SNS-***`). Monitors equipment health & prevents production loss.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select 
                value={newSensorType} 
                onChange={e => setNewSensorType(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
              >
                <option value="Temperature">Temperature Sensor</option>
                <option value="Vibration">Vibration Sensor</option>
                <option value="Power">Power Transducer</option>
                <option value="Humidity">Humidity Sensor</option>
                <option value="Pressure">Pressure Gauge</option>
              </select>
              <button className="btn-add-machine" onClick={handleAddSensor} style={{ background: '#00e68a', color: '#000', fontWeight: 700 }}>
                ➕ Calibrate New Sensor
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {attachedSensors.map(sensor => (
              <div 
                key={sensor.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {sensor.type}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#00e68a', background: 'rgba(0,230,138,0.12)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>
                    {sensor.status}
                  </span>
                </div>
                <h4 style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 700 }}>{sensor.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Model: {sensor.model}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Live Sensor Signal:</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#00e68a', fontFamily: 'Inter, monospace' }}>{sensor.reading}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                        <stop offset="5%" stopColor="#ff3b6a" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ff3b6a" stopOpacity={0} />
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
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
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

      {/* Edit Machine Modal Overlay */}
      {showEditModal && machine && (
        <EditMachineModal
          machine={machine}
          onClose={() => setShowEditModal(false)}
          onUpdated={updated => {
            setMachine(updated);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default MachineDetailView;
