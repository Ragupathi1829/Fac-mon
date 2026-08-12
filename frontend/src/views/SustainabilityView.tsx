import React from 'react';
import Navbar from '../components/Navbar';
import SustainabilityDashboard from '../views/SustainabilityDashboard';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WsMessage } from '../types/machine';

const SustainabilityView: React.FC = () => {
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
          <h1>♻️ Sustainability Dashboard</h1>
          <p className="system-time">PULSE · Environmental Impact Analytics</p>
        </header>

        <main className="dashboard-main">
          <SustainabilityDashboard />
        </main>
      </div>
    </div>
  );
};

export default SustainabilityView;
