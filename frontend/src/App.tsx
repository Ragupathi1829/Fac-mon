import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Dashboard from './views/Dashboard';
import MachinesView from './views/MachinesView';
import AlertsView from './views/AlertsView';
import MachineDetailView from './views/MachineDetailView';
import './index.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/machines" element={<MachinesView />} />
          <Route path="/machines/:id" element={<MachineDetailView />} />
          <Route path="/alerts" element={<AlertsView />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;

