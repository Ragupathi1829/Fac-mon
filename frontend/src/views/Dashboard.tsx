import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

const STATUS_COLORS: Record<string, string> = {
  RUNNING: '#00e68a',
  IDLE:    '#ffb020',
  STOPPED: '#64748b',
  ERROR:   '#ff3b6a',
};

const Dashboard: React.FC = () => {
  const { state, dispatch, handleWsMessage } = useApp();
  const [dashboardView, setDashboardView] = useState<'GRID' | 'TWIN' | 'SUSTAIN'>('GRID');

  const handleMessage = React.useCallback((msg: WsMessage) => {
    handleWsMessage(msg);
  }, [handleWsMessage]);

  const handleConnectionChange = React.useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  }, [dispatch]);

  useWebSocket(handleMessage, handleConnectionChange);

  // Build donut chart data
  const statusCounts = {
    RUNNING: state.machines.filter(m => m.status === 'RUNNING').length,
    IDLE:    state.machines.filter(m => m.status === 'IDLE').length,
    STOPPED: state.machines.filter(m => m.status === 'STOPPED').length,
    ERROR:   state.machines.filter(m => m.status === 'ERROR').length,
  };

  const chartData = Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  return (
    <div className="app-root">
      <Navbar />
      <ActivityTicker />
      <div className="dashboard-container">
        <header className="dashboard-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: 'none' }}>
          <div>
            <h1>SmartFactory 360</h1>
            <p className="system-time">PULSE · Live Factory Analytics</p>
          </div>
          
          {/* Dashboard View Switcher */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '0.25rem', borderRadius: '10px' }}>
            <button 
              className="filter-tab" 
              style={{ border: 'none', background: dashboardView === 'GRID' ? 'rgba(0,212,255,0.08)' : 'transparent', color: dashboardView === 'GRID' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
              onClick={() => setDashboardView('GRID')}
            >
              📊 Grid View
            </button>
            <button 
              className="filter-tab" 
              style={{ border: 'none', background: dashboardView === 'TWIN' ? 'rgba(0,212,255,0.08)' : 'transparent', color: dashboardView === 'TWIN' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
              onClick={() => setDashboardView('TWIN')}
            >
              🗺️ Digital Twin
            </button>
            <button 
              className="filter-tab" 
              style={{ border: 'none', background: dashboardView === 'SUSTAIN' ? 'rgba(0,212,255,0.08)' : 'transparent', color: dashboardView === 'SUSTAIN' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
              onClick={() => setDashboardView('SUSTAIN')}
            >
              ♻️ Sustainability
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {/* Render corresponding view */}
          {dashboardView === 'SUSTAIN' ? (
            <SustainabilityDashboard />
          ) : (
            <>
              <KpiPanel />

              {/* Machine Status Summary */}
              {state.machines.length > 0 && dashboardView === 'GRID' && (
                <div className="dashboard-summary-bar">
                  <div className="summary-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={32}
                          outerRadius={52}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={index} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#0d1320',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: '0.78rem',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="summary-stats">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="summary-stat">
                        <span className="summary-stat-dot" style={{ background: STATUS_COLORS[status] }} />
                        <span className="summary-stat-count">{count}</span>
                        <span style={{ color: '#8b9dc3' }}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboardView === 'TWIN' ? (
                <FloorMap />
              ) : (
                <div className="dashboard-content-layout">
                  <section className="main-content-section">
                    <MachineGrid />
                  </section>

                  <aside className="sidebar-section">
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
