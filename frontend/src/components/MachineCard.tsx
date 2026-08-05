import React from 'react';
import type { Machine, TelemetryLog } from '../types/machine';

interface MachineCardProps {
  machine: Machine;
  telemetry?: TelemetryLog;
  onClick?: () => void;
}

const STATUS_CONFIG = {
  RUNNING:  { color: '#00e68a', glow: 'rgba(0,230,138,0.18)', label: 'Running',  dot: '#00e68a' },
  IDLE:     { color: '#ffb020', glow: 'rgba(255,176,32,0.15)',  label: 'Idle',     dot: '#ffb020' },
  STOPPED:  { color: '#64748b', glow: 'rgba(100,116,139,0.15)', label: 'Stopped',  dot: '#64748b' },
  ERROR:    { color: '#ff3b6a', glow: 'rgba(255,59,106,0.18)',  label: 'Error',    dot: '#ff3b6a' },
};

const MachineCard: React.FC<MachineCardProps> = ({ machine, telemetry, onClick }) => {
  const cfg = STATUS_CONFIG[machine.status] ?? STATUS_CONFIG.IDLE;
  const isRunning = machine.status === 'RUNNING';
  const isError = machine.status === 'ERROR';

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
          <span
            className="status-dot"
            style={{
              background: cfg.dot,
              boxShadow: isRunning ? `0 0 8px ${cfg.dot}` : 'none',
              animation: isRunning ? 'livePulse 2s ease-in-out infinite' : isError ? 'pulse-dot 1s ease-in-out infinite' : 'none',
            }}
          />
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
          <GaugeMetric label="Temp" value={telemetry.temperature} unit="°C" max={120} warning={75} critical={90} />
          <GaugeMetric label="Vibration" value={telemetry.vibration} unit="mm/s" max={12} warning={6} critical={8.5} />
          <GaugeMetric label="Pressure" value={telemetry.pressure} unit="bar" max={12} warning={8} critical={9.5} />
          <GaugeMetric label="Power" value={telemetry.powerConsumption} unit="kW" max={120} warning={80} critical={95} />
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

// ─── Radial Gauge Metric ─────────────────────────────────────────────────────

interface GaugeMetricProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  warning: number;
  critical: number;
}

const GaugeMetric: React.FC<GaugeMetricProps> = ({ label, value, unit, max, warning, critical }) => {
  const isCritical = value >= critical;
  const isWarning  = !isCritical && value >= warning;
  const color = isCritical ? '#ff3b6a' : isWarning ? '#ffb020' : '#00e68a';

  const percentage = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 14; // radius = 14
  const dashOffset = circumference * (1 - percentage);

  return (
    <div className="telemetry-metric">
      <div className="gauge-ring">
        <svg viewBox="0 0 36 36">
          <circle className="gauge-ring-bg" cx="18" cy="18" r="14" />
          <circle
            className="gauge-ring-fill"
            cx="18" cy="18" r="14"
            stroke={color}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span className="gauge-value-text" style={{ color }}>
          {Math.round(value)}
        </span>
      </div>
      <div className="metric-info">
        <span className="metric-label">{label}</span>
        <span className="metric-value" style={{ color }}>
          {value.toFixed(1)}<span className="metric-unit">{unit}</span>
        </span>
      </div>
    </div>
  );
};

export default MachineCard;
