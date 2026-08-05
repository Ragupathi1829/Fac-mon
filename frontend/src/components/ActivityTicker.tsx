import React from 'react';
import { useApp } from '../context/AppContext';

const ActivityTicker: React.FC = () => {
  const { state } = useApp();

  // Build ticker items from latest telemetry and alerts
  const items: { text: string; color: string }[] = [];

  // Add latest telemetry events
  Object.values(state.latestTelemetry).forEach(t => {
    items.push({
      text: `${t.machineName} — Temp: ${t.temperature.toFixed(1)}°C | Vibration: ${t.vibration.toFixed(1)}mm/s | Pressure: ${t.pressure.toFixed(1)}bar`,
      color: t.temperature >= 90 ? '#ff3b6a' : t.temperature >= 75 ? '#ffb020' : '#00e68a',
    });
  });

  // Add recent alerts
  state.alerts.slice(0, 5).forEach(a => {
    const color = a.severity === 'CRITICAL' ? '#ff3b6a' : a.severity === 'WARNING' ? '#ffb020' : '#00d4ff';
    items.push({
      text: `${a.severity}: ${a.message}`,
      color,
    });
  });

  if (items.length === 0) {
    items.push({ text: 'System online — awaiting telemetry data…', color: '#506080' });
  }

  // Duplicate items for seamless scroll loop
  const allItems = [...items, ...items];
  const duration = Math.max(items.length * 6, 20);

  return (
    <div className="activity-ticker">
      <span className="ticker-label">● Live</span>
      <div className="ticker-track">
        <div className="ticker-scroll" style={{ '--ticker-duration': `${duration}s` } as React.CSSProperties}>
          {allItems.map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" style={{ background: item.color }} />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityTicker;
