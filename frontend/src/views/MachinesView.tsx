import React from 'react';
import Navbar from '../components/Navbar';
import MachineGrid from '../components/MachineGrid';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WsMessage } from '../types/machine';

const MachinesView: React.FC = () => {
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
          <h1>⚙️ Machines</h1>
          <p className="system-time">PULSE · All Registered Machines</p>
        </header>

        <main className="dashboard-main">
          <MachineGrid />
        </main>
      </div>
    </div>
  );
};

export default MachinesView;
