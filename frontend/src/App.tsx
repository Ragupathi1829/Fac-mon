import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
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

import LoginView from './views/LoginView';
import ProfileView from './views/ProfileView';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useApp();
  if (!state.currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { state } = useApp();
  return (
    <div className="app-root">
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/machines" element={<ProtectedRoute><MachinesView /></ProtectedRoute>} />
        <Route path="/machines/:id" element={<ProtectedRoute><MachineDetailView /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsView /></ProtectedRoute>} />
        <Route path="/sustainability" element={<ProtectedRoute><SustainabilityView /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute><MaintenanceInventoryView /></ProtectedRoute>} />
        <Route path="/workers" element={<ProtectedRoute><WorkersView /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentCenterView /></ProtectedRoute>} />
      </Routes>
      {state.currentUser && <ChatAssistant />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
