import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ActivityTicker from '../components/ActivityTicker';
import MachineGrid from '../components/MachineGrid';
import AddMachineModal from '../components/AddMachineModal';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WsMessage } from '../types/machine';

const MachinesView: React.FC = () => {
  const { state, dispatch, handleWsMessage } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleMessage = React.useCallback((msg: WsMessage) => {
    handleWsMessage(msg);
  }, [handleWsMessage]);

  const handleConnectionChange = React.useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  }, [dispatch]);

  useWebSocket(handleMessage, handleConnectionChange);

  const statusCounts = {
    running: state.machines.filter(m => m.status === 'RUNNING').length,
    idle:    state.machines.filter(m => m.status === 'IDLE').length,
    stopped: state.machines.filter(m => m.status === 'STOPPED').length,
    error:   state.machines.filter(m => m.status === 'ERROR').length,
  };

  return (
    <div className="app-root">
      <Navbar />
      <ActivityTicker />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="machines-view-header">
            <div>
              <h1>⚙️ Machines</h1>
              <p className="system-time">PULSE · All Registered Machines</p>
            </div>
            <button className="btn-add-machine" onClick={() => setShowAddModal(true)}>
              ➕ Add Machine
            </button>
          </div>
        </header>

        {/* Quick Stats Bar */}
        <div className="kpi-panel" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="kpi-card kpi-card-cyan">
            <div className="kpi-card-icon" style={{ background: 'rgba(0,212,255,0.08)' }}>🏭</div>
            <div className="kpi-card-body">
              <h3>Total</h3>
              <p className="kpi-value">{state.machines.length}</p>
            </div>
          </div>
          <div className="kpi-card kpi-card-emerald">
            <div className="kpi-card-icon" style={{ background: 'rgba(0,230,138,0.08)' }}>🟢</div>
            <div className="kpi-card-body">
              <h3>Running</h3>
              <p className="kpi-value" style={{ color: '#00e68a' }}>{statusCounts.running}</p>
            </div>
          </div>
          <div className="kpi-card kpi-card-amber">
            <div className="kpi-card-icon" style={{ background: 'rgba(255,176,32,0.08)' }}>🟡</div>
            <div className="kpi-card-body">
              <h3>Idle</h3>
              <p className="kpi-value" style={{ color: '#ffb020' }}>{statusCounts.idle}</p>
            </div>
          </div>
          <div className="kpi-card kpi-card-rose">
            <div className="kpi-card-icon" style={{ background: 'rgba(255,59,106,0.08)' }}>🔴</div>
            <div className="kpi-card-body">
              <h3>Error</h3>
              <p className="kpi-value" style={{ color: '#ff3b6a' }}>{statusCounts.error}</p>
            </div>
          </div>
        </div>

        <main className="dashboard-main">
          <MachineGrid />
        </main>
      </div>

      {showAddModal && <AddMachineModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default MachinesView;
