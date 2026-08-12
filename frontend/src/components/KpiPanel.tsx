import React, { useEffect, useCallback, useRef, useState } from 'react';
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

// ── Animated Count-Up Hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration: number = 800): number {
  const [current, setCurrent] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (target === prevRef.current) return;
    const start = prevRef.current;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = start + diff * eased;
      setCurrent(Math.round(val * 10) / 10); // 1 decimal precision
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return current;
}

// ── 3D Tilt Card Wrapper ──────────────────────────────────────────────────────
interface TiltCardProps {
  className: string;
  glowColor: string;
  children: React.ReactNode;
}

const TiltCard: React.FC<TiltCardProps> = ({ className, glowColor, children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    if (glow) {
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={glowRef}
        className="card-glow"
        style={{ '--glow-color': glowColor } as React.CSSProperties}
      />
      {children}
    </div>
  );
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

  // Animated values
  const animRunning = useCountUp(kpi?.runningMachines ?? 0);
  const animTotal = useCountUp(kpi?.totalMachines ?? 0);
  const animOee = useCountUp(kpi?.oeePercent ?? 0, 1200);
  const animAlerts = useCountUp(kpi?.activeAlerts ?? 0);
  const animErrors = useCountUp(kpi?.errorMachines ?? 0);

  return (
    <div className="kpi-panel reveal-stagger">
      {/* Active Machines */}
      <TiltCard className="kpi-card kpi-card-cyan reveal" glowColor="rgba(0,212,255,0.12)">
        <div className="kpi-card-icon" style={{ color: '#00d4ff' }}>
          <GearIcon />
        </div>
        <div className="kpi-card-body">
          <h3>Active Machines</h3>
          {state.kpiLoading ? (
            <p className="kpi-value skeleton-text">—</p>
          ) : (
            <p className="kpi-value">
              <span className="kpi-highlight count-up-value">{Math.round(animRunning)}</span>
              <span className="kpi-divider"> / {Math.round(animTotal)}</span>
            </p>
          )}
          <div className="kpi-sub-row">
            <span className="kpi-sub idle">Idle: {kpi?.idleMachines ?? 0}</span>
            <span className="kpi-sub stopped">Stopped: {kpi?.stoppedMachines ?? 0}</span>
          </div>
        </div>
      </TiltCard>

      {/* OEE */}
      <TiltCard className="kpi-card kpi-card-emerald reveal" glowColor="rgba(0,230,138,0.12)">
        <div className="kpi-card-icon" style={{ color: '#00e68a' }}>
          <ChartIcon />
        </div>
        <div className="kpi-card-body">
          <h3>Overall OEE</h3>
          {state.kpiLoading ? (
            <p className="kpi-value skeleton-text">—</p>
          ) : (
            <p className="kpi-value">
              <span className="kpi-highlight count-up-value">{animOee.toFixed(1)}</span>
              <span className="kpi-unit"> %</span>
            </p>
          )}
          <div className="oee-bar-track">
            <div className="oee-bar-fill" style={{ width: `${kpi?.oeePercent ?? 0}%` }} />
          </div>
        </div>
      </TiltCard>

      {/* Active Alerts */}
      <TiltCard
        className={`kpi-card ${(kpi?.criticalAlerts ?? 0) > 0 ? 'kpi-card-rose' : 'kpi-card-amber'} reveal`}
        glowColor={(kpi?.criticalAlerts ?? 0) > 0 ? 'rgba(255,59,106,0.12)' : 'rgba(255,176,32,0.12)'}
      >
        <div className="kpi-card-icon" style={{ color: (kpi?.criticalAlerts ?? 0) > 0 ? '#ff3b6a' : '#ffb020' }}>
          <AlertIcon />
        </div>
        <div className="kpi-card-body">
          <h3>Active Alerts</h3>
          {state.kpiLoading ? (
            <p className="kpi-value skeleton-text">—</p>
          ) : (
            <p className="kpi-value">
              <span className="kpi-highlight count-up-value">{Math.round(animAlerts)}</span>
            </p>
          )}
          <div className="kpi-sub-row">
            <span className="kpi-sub critical">Critical: {kpi?.criticalAlerts ?? 0}</span>
            <span className="kpi-sub warning">Warning: {kpi?.warningAlerts ?? 0}</span>
          </div>
        </div>
      </TiltCard>

      {/* Machine Errors */}
      <TiltCard className="kpi-card kpi-card-blue reveal" glowColor="rgba(59,130,246,0.12)">
        <div className="kpi-card-icon" style={{ color: '#3b82f6' }}>
          <ShieldIcon />
        </div>
        <div className="kpi-card-body">
          <h3>Machines in Error</h3>
          {state.kpiLoading ? (
            <p className="kpi-value skeleton-text">—</p>
          ) : (
            <p className="kpi-value">
              <span className="kpi-highlight count-up-value">{Math.round(animErrors)}</span>
              <span className="kpi-unit"> machines</span>
            </p>
          )}
          <p className="kpi-sub">{kpi?.errorMachines === 0 ? '✅ All systems nominal' : '⚠️ Requires attention'}</p>
        </div>
      </TiltCard>
    </div>
  );
};

export default KpiPanel;
