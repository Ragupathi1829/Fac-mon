import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import RegisterModal from '../components/RegisterModal';

const WorkersView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const activeWorkers = state.workers.map(w => {
    if (w.shift !== 'MORNING') {
      return { ...w, attendance: 'ABSENT' as const };
    }
    return w;
  });

  return (
    <div className="app-root">
      <Navbar />
      <div className="dashboard-container">
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>👥 Worker Management</h1>
            <p className="system-time">PULSE · Personnel & Shift Operations</p>
          </div>
          <button
            onClick={() => setIsRegisterOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #00e68a, #00d4ff)',
              color: '#000000',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(0,230,138,0.2)'
            }}
          >
            ➕ Register New Worker
          </button>
        </header>

        <main className="dashboard-main">
          {/* Worker Stats Overview */}
          <div className="kpi-panel" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="kpi-card kpi-card-cyan">
              <div className="kpi-card-icon" style={{ color: '#00d4ff' }}>👥</div>
              <div className="kpi-card-body">
                <h3>Workers Present</h3>
                <p className="kpi-value">
                  {activeWorkers.filter(w => w.attendance === 'PRESENT').length}
                  <span className="kpi-divider"> / {activeWorkers.length}</span>
                </p>
              </div>
            </div>

            <div className="kpi-card kpi-card-emerald">
              <div className="kpi-card-icon" style={{ color: '#00e68a' }}>⚡</div>
              <div className="kpi-card-body">
                <h3>Shift Productivity</h3>
                <p className="kpi-value">91.4%</p>
              </div>
            </div>

            <div className="kpi-card kpi-card-amber">
              <div className="kpi-card-icon" style={{ color: '#ffb020' }}>🛡️</div>
              <div className="kpi-card-body">
                <h3>Safety Compliance</h3>
                <p className="kpi-value">
                  {Math.round((activeWorkers.filter(w => w.safetyTraining).length / activeWorkers.length) * 100)}%
                </p>
              </div>
            </div>

            <div className="kpi-card kpi-card-blue">
              <div className="kpi-card-icon" style={{ color: '#3b82f6' }}>⏳</div>
              <div className="kpi-card-body">
                <h3>Active Shift</h3>
                <p className="kpi-value" style={{ fontSize: '1.4rem' }}>Morning (06:00 - 14:00)</p>
              </div>
            </div>
          </div>

          {/* Workers Table */}
          <div className="chart-card">
            <h3 style={{ marginBottom: '1rem' }}>👷 Active Floor Personnel</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem' }}>Worker Name</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Assigned Machine</th>
                    <th style={{ padding: '0.75rem' }}>Active Shift</th>
                    <th style={{ padding: '0.75rem' }}>Safety Cert.</th>
                    <th style={{ padding: '0.75rem' }}>Perf. Index</th>
                    <th style={{ padding: '0.75rem' }}>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {activeWorkers.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={w.avatar} alt={w.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontWeight: 600 }}>{w.name}</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{w.role}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{w.assignedMachineName || 'Unassigned'}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{w.shift}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          color: w.safetyTraining ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                          background: w.safetyTraining ? 'rgba(0,230,138,0.1)' : 'rgba(255,59,106,0.1)',
                          padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700
                        }}>
                          {w.safetyTraining ? 'Certified' : 'Required'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontWeight: 700, color: w.performanceScore > 85 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                          {w.performanceScore}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          color: w.attendance === 'PRESENT' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                          fontWeight: 700
                        }}>
                          ● {w.attendance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(newUser) => {
          dispatch({
            type: 'ADD_WORKER',
            payload: {
              id: newUser.id,
              name: newUser.fullName,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
              role: newUser.designation,
              shift: 'MORNING',
              attendance: 'PRESENT',
              safetyTraining: true,
              performanceScore: 100,
            }
          });
        }}
      />
    </div>
  );
};

export default WorkersView;
