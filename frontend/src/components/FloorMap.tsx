import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Machine } from '../types/machine';

interface StageNode {
  id: string;
  name: string;
  desc: string;
  x: number;
  y: number;
}

const FLOW_STAGES: StageNode[] = [
  { id: 'WAREHOUSE', name: 'Warehouse', desc: 'Raw PET intake & sort', x: 80, y: 150 },
  { id: 'STORAGE', name: 'PET Storage', desc: 'Silo buffer storage', x: 240, y: 150 },
  { id: 'CLEANING', name: 'Cleaning', desc: 'Hot wash & decontamination', x: 400, y: 150 },
  { id: 'CRUSHER', name: 'Crusher', desc: 'Flake granulation process', x: 560, y: 150 },
  { id: 'EXTRUDER', name: 'Extruder', desc: 'Melting & melt spinning', x: 560, y: 350 },
  { id: 'COOLING', name: 'Cooling', desc: 'Filament quenching', x: 400, y: 350 },
  { id: 'WINDING', name: 'Winding', desc: 'Yarn package building', x: 240, y: 350 },
  { id: 'PACKING', name: 'Packing', desc: 'Finished goods boxing', x: 80, y: 350 },
];

const STATUS_COLORS: Record<string, string> = {
  RUNNING: '#00e68a',
  IDLE: '#ffb020',
  STOPPED: '#64748b',
  ERROR: '#ff3b6a',
};

const FloorMap: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  // Helper to map machines to pipeline stages by simple keyword match
  const getMachineForStage = (stageId: string): Machine | undefined => {
    return state.machines.find(m => {
      const typeLower = m.type.toLowerCase();
      const codeLower = m.machineCode.toLowerCase();
      const nameLower = m.name.toLowerCase();
      
      if (stageId === 'EXTRUDER') return typeLower.includes('extruder') || nameLower.includes('extruder');
      if (stageId === 'CRUSHER') return typeLower.includes('crush') || nameLower.includes('crush') || codeLower.includes('crush');
      if (stageId === 'CLEANING') return typeLower.includes('clean') || nameLower.includes('wash') || nameLower.includes('clean');
      if (stageId === 'STORAGE') return typeLower.includes('store') || nameLower.includes('storage') || nameLower.includes('silo');
      if (stageId === 'WAREHOUSE') return typeLower.includes('warehouse') || nameLower.includes('intake');
      if (stageId === 'COOLING') return typeLower.includes('cool') || nameLower.includes('cool') || nameLower.includes('chill');
      if (stageId === 'WINDING') return typeLower.includes('wind') || nameLower.includes('wind') || nameLower.includes('spin');
      if (stageId === 'PACKING') return typeLower.includes('pack') || nameLower.includes('pack') || nameLower.includes('box');
      return false;
    });
  };

  return (
    <div className="chart-card" style={{ padding: '2rem', overflowX: 'auto' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🗺️</span> Digital Twin Process Flow (Shree Renga Polyester Plant Layout)
      </h3>
      
      <div style={{ position: 'relative', width: '840px', height: '480px', margin: '0 auto' }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#506080" />
            </marker>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00e68a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Draw connecting layout flow pipes/lines */}
          <path
            d="M 80 150 L 240 150 L 400 150 L 560 150 C 620 150, 620 350, 560 350 L 400 350 L 240 350 L 80 350"
            fill="none"
            stroke="url(#flowGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 80 150 L 240 150 L 400 150 L 560 150 C 620 150, 620 350, 560 350 L 400 350 L 240 350 L 80 350"
            fill="none"
            stroke="#506080"
            strokeWidth="2"
            strokeDasharray="8 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'dash 30s linear infinite' }}
          />

          {FLOW_STAGES.map((stage) => {
            const machine = getMachineForStage(stage.id);
            const status = machine?.status || 'STOPPED';
            const color = STATUS_COLORS[status];
            const telemetry = machine ? state.latestTelemetry[machine.id] : null;

            return (
              <g key={stage.id} transform={`translate(${stage.x - 70}, ${stage.y - 50})`} style={{ cursor: machine ? 'pointer' : 'default' }} onClick={() => machine && navigate(`/machines/${machine.id}`)}>
                {/* Node Box */}
                <rect
                  width="140"
                  height="80"
                  rx="14"
                  fill="rgba(13, 19, 32, 0.95)"
                  stroke={machine ? color : '#1b2542'}
                  strokeWidth="2"
                  style={{
                    filter: machine && status === 'RUNNING' ? 'drop-shadow(0 0 6px rgba(0, 230, 138, 0.2))' : 'none',
                    transition: 'all 0.3s'
                  }}
                />

                {/* Left Status Bar Indicator */}
                <rect width="6" height="80" rx="3" fill={color} />

                {/* Stage Title */}
                <text x="14" y="24" fill="#f0f4f8" fontSize="0.75rem" fontWeight="800">
                  {stage.name}
                </text>

                {/* Subtitle / Description */}
                <text x="14" y="42" fill="#8b9dc3" fontSize="0.55rem">
                  {machine ? `${machine.machineCode} • ${machine.name}` : stage.desc}
                </text>

                {/* Live Output */}
                {telemetry && (
                  <text x="14" y="60" fill={color} fontSize="0.6rem" fontWeight="700">
                    {status === 'RUNNING' ? `⚡ ${telemetry.productionSpeed} kg/hr • Health ${telemetry.healthScore}%` : `⚪ Offline`}
                  </text>
                )}
                {!telemetry && (
                  <text x="14" y="60" fill="#506080" fontSize="0.6rem">
                    No machine linked
                  </text>
                )}

                {/* Alert Warning Dot */}
                {machine && state.alerts.some(a => a.machineId === machine.id && !a.resolved) && (
                  <circle cx="126" cy="14" r="6" fill="#ff3b6a" style={{ animation: 'pulse-dot 1s infinite' }} />
                )}
              </g>
            );
          })}
        </svg>

        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -1000;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default FloorMap;
