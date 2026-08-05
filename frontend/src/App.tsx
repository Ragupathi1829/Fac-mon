import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Dashboard from './views/Dashboard';
import MachinesView from './views/MachinesView';
import AlertsView from './views/AlertsView';
import SustainabilityView from './views/SustainabilityView';
import MaintenanceInventoryView from './views/MaintenanceInventoryView';
import WorkersView from './views/WorkersView';
import DocumentCenterView from './views/DocumentCenterView';
import MachineDetailView from './views/MachineDetailView';
import ChatAssistant from './components/ChatAssistant';
import './index.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-root">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/machines" element={<MachinesView />} />
            <Route path="/machines/:id" element={<MachineDetailView />} />
            <Route path="/alerts" element={<AlertsView />} />
            <Route path="/sustainability" element={<SustainabilityView />} />
            <Route path="/maintenance" element={<MaintenanceInventoryView />} />
            <Route path="/workers" element={<WorkersView />} />
            <Route path="/documents" element={<DocumentCenterView />} />
          </Routes>
          <ChatAssistant />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
