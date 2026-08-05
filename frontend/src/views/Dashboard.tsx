import React from 'react';
import KpiPanel from '../components/KpiPanel';
import MachineGrid from '../components/MachineGrid';
import AlertCenter from '../components/AlertCenter';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WsMessage } from '../types/machine';

const Dashboard: React.FC = () => {
  const { dispatch, handleWsMessage } = useApp();

  const handleMessage = React.useCallback((msg: WsMessage) => {
    handleWsMessage(msg);
  }, [handleWsMessage]);

  const handleConnectionChange = React.useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  }, [dispatch]);

  useWebSocket(handleMessage, handleConnectionChange);

  return (
    <div className="app-root">
      <Navbar />
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Factory Floor Dashboard</h1>
          <p className="system-time">PULSE · Live Factory Analytics</p>
        </header>

        <main className="dashboard-main">
          <KpiPanel />

          <div className="dashboard-content-layout">
            <section className="main-content-section">
              <MachineGrid />
            </section>

            <aside className="sidebar-section">
              <AlertCenter />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
