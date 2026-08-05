import React from 'react';
import type { Machine, TelemetryLog } from '../types/machine';

interface MachineCardProps {
  machine: Machine;
  telemetry?: TelemetryLog;
  onClick?: () => void;
}

const STATUS_CONFIG = {
  RUNNING:  { color: '#10b981', glow: 'rgba(16,185,129,0.25)', label: 'Running',  dot: '#10b981' },
  IDLE:     { color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',  label: 'Idle',     dot: '#f59e0b' },
  STOPPED:  { color: '#64748b', glow: 'rgba(100,116,139,0.2)', label: 'Stopped',  dot: '#64748b' },
  ERROR:    { color: '#f43f5e', glow: 'rgba(244,63,94,0.25)',  label: 'Error',    dot: '#f43f5e' },
};

const MachineCard: React.FC<MachineCardProps> = ({ machine, telemetry, onClick }) => {
  const cfg = STATUS_CONFIG[machine.status] ?? STATUS_CONFIG.IDLE;
  const isRunning = machine.status === 'RUNNING';

  return (
    <div className="machine-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* Status glow accent bar */}
      <div className="machine-card-accent" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

      {/* Header */}
      <div className="machine-card-header">
        <div>
          <span className="machine-card-code">{machine.machineCode}</span>
          <h3 className="machine-card-name">{machine.name}</h3>
        </div>
        <div className="machine-status-badge" style={{ background: cfg.glow, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
          <span className="status-dot" style={{ background: cfg.dot, boxShadow: isRunning ? `0 0 6px ${cfg.dot}` : 'none' }} />
          {cfg.label}
        </div>
      </div>

      {/* Meta */}
      <div className="machine-card-meta">
        <span className="machine-meta-tag">{machine.type}</span>
        <span className="machine-meta-location">📍 {machine.location}</span>
      </div>

      {/* Telemetry Gauges */}
      {telemetry ? (
        <div className="machine-telemetry-grid">
          <TelemetryMetric label="Temp" value={telemetry.temperature} unit="°C" warning={75} critical={90} />
          <TelemetryMetric label="Vibration" value={telemetry.vibration} unit="mm/s" warning={6} critical={8.5} />
          <TelemetryMetric label="Pressure" value={telemetry.pressure} unit="bar" warning={8} critical={9.5} />
          <TelemetryMetric label="Power" value={telemetry.powerConsumption} unit="kW" warning={80} critical={95} />
        </div>
      ) : (
        <div className="machine-telemetry-empty">
          {isRunning ? (
            <span className="telemetry-waiting">⏳ Awaiting first telemetry…</span>
          ) : (
            <span className="telemetry-offline">Machine is {cfg.label.toLowerCase()}</span>
          )}
        </div>
      )}

      {/* Click hint */}
      {onClick && (
        <div className="machine-card-footer">
          <span>View details →</span>
        </div>
      )}
    </div>
  );
};

// ─── Metric Sub-component ────────────────────────────────────────────────────

interface TelemetryMetricProps {
  label: string;
  value: number;
  unit: string;
  warning: number;
  critical: number;
}

const TelemetryMetric: React.FC<TelemetryMetricProps> = ({ label, value, unit, warning, critical }) => {
  const isCritical = value >= critical;
  const isWarning  = !isCritical && value >= warning;
  const color = isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';

  return (
    <div className="telemetry-metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={{ color }}>
        {value.toFixed(1)}<span className="metric-unit">{unit}</span>
      </span>
    </div>
  );
};

export default MachineCard;
