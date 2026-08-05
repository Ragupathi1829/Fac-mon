import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Dashboard from './views/Dashboard';
import MachineDetailView from './views/MachineDetailView';
import './index.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/machines/:id" element={<MachineDetailView />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
