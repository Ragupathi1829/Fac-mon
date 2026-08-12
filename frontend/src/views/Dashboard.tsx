import React, { useState, useEffect, useRef } from 'react';
import KpiPanel from '../components/KpiPanel';
import MachineGrid from '../components/MachineGrid';
import AlertCenter from '../components/AlertCenter';
import ActivityTicker from '../components/ActivityTicker';
import Navbar from '../components/Navbar';
import FloorMap from '../components/FloorMap';
import SustainabilityDashboard from './SustainabilityDashboard';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WsMessage } from '../types/machine';

// ── Floating Particles Component ──────────────────────────────────────────────
const PARTICLE_CONFIG = [
  { size: 4, left: '10%', color: 'rgba(0,212,255,0.15)', duration: '22s', delay: '0s', maxOpacity: 0.12 },
  { size: 3, left: '25%', color: 'rgba(0,230,138,0.15)', duration: '28s', delay: '3s', maxOpacity: 0.1 },
  { size: 5, left: '40%', color: 'rgba(59,130,246,0.12)', duration: '20s', delay: '1s', maxOpacity: 0.08 },
  { size: 3, left: '55%', color: 'rgba(167,139,250,0.12)', duration: '25s', delay: '5s', maxOpacity: 0.1 },
  { size: 4, left: '70%', color: 'rgba(0,212,255,0.12)', duration: '23s', delay: '2s', maxOpacity: 0.1 },
  { size: 3, left: '85%', color: 'rgba(0,230,138,0.12)', duration: '27s', delay: '4s', maxOpacity: 0.08 },
  { size: 2, left: '15%', color: 'rgba(59,130,246,0.1)',  duration: '30s', delay: '6s', maxOpacity: 0.06 },
  { size: 4, left: '60%', color: 'rgba(167,139,250,0.1)', duration: '26s', delay: '7s', maxOpacity: 0.08 },
  { size: 3, left: '90%', color: 'rgba(0,212,255,0.1)',   duration: '24s', delay: '1.5s', maxOpacity: 0.1 },
  { size: 2, left: '35%', color: 'rgba(0,230,138,0.08)',  duration: '32s', delay: '8s', maxOpacity: 0.06 },
];

const FloatingParticles: React.FC = () => (
  <div className="floating-particles">
    {PARTICLE_CONFIG.map((p, i) => (
      <div
        key={i}
        className="particle"
        style={{
          width: p.size,
          height: p.size,
          left: p.left,
          background: p.color,
          '--duration': p.duration,
          '--delay': p.delay,
          '--max-opacity': p.maxOpacity,
        } as React.CSSProperties}
      />
    ))}
  </div>
);

// ── Scroll Progress Bar Hook ──────────────────────────────────────────────────
function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress((scrollTop / docHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

// ── Scroll Reveal Hook ────────────────────────────────────────────────────────
function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    // Observe all .reveal elements inside the container
    const revealElements = container.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return containerRef;
}

// ── Dashboard Component ───────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { dispatch, handleWsMessage } = useApp();
  const [activeView, setActiveView] = useState<'GRID' | 'TWIN' | 'SUSTAIN'>('GRID');
  const scrollProgress = useScrollProgress();
  const revealRef = useScrollReveal();

  const handleMessage = React.useCallback((msg: WsMessage) => {
    handleWsMessage(msg);
  }, [handleWsMessage]);

  const handleConnectionChange = React.useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  }, [dispatch]);

  useWebSocket(handleMessage, handleConnectionChange);

  return (
    <div className="app-root">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Floating Particles Background */}
      <FloatingParticles />

      <Navbar />
      <ActivityTicker />

      {/* ═══════════════════════════════════════════════════════════════════════════════
         ✦ MAIN INDUSTRIAL DASHBOARD (KPIs, REAL-TIME SENSOR GRID & ALERTS) ✦
         ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="dashboard-container" ref={revealRef}>
        <header className="dashboard-header reveal" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: 'none' }}>
          <div>
            <h1>SmartFactory 360</h1>
            <p className="system-time">PULSE · Live Factory Analytics & Machine Monitoring</p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', padding: '0.3rem', borderRadius: '30px' }}>
            <button 
              className="filter-tab" 
              style={{ borderRadius: '20px', border: 'none', background: activeView === 'GRID' ? 'rgba(0,230,138,0.2)' : 'transparent', color: activeView === 'GRID' ? '#00e68a' : '#ffffff' }}
              onClick={() => setActiveView('GRID')}
            >
              📊 Machine Grid
            </button>
            <button 
              className="filter-tab" 
              style={{ borderRadius: '20px', border: 'none', background: activeView === 'TWIN' ? 'rgba(0,212,255,0.2)' : 'transparent', color: activeView === 'TWIN' ? '#00d4ff' : '#ffffff' }}
              onClick={() => setActiveView('TWIN')}
            >
              🗺️ Digital Twin Map
            </button>
            <button 
              className="filter-tab" 
              style={{ borderRadius: '20px', border: 'none', background: activeView === 'SUSTAIN' ? 'rgba(0,230,138,0.2)' : 'transparent', color: activeView === 'SUSTAIN' ? '#00e68a' : '#ffffff' }}
              onClick={() => setActiveView('SUSTAIN')}
            >
              ♻️ Sustainability
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {activeView === 'SUSTAIN' ? (
            <div className="reveal">
              <SustainabilityDashboard />
            </div>
          ) : (
            <>
              <div className="reveal">
                <KpiPanel />
              </div>

              {activeView === 'TWIN' ? (
                <div className="reveal">
                  <FloorMap />
                </div>
              ) : (
                <div className="dashboard-content-layout">
                  <section className="main-content-section reveal-left">
                    <MachineGrid />
                  </section>

                  <aside className="sidebar-section reveal-right">
                    <AlertCenter />
                  </aside>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
