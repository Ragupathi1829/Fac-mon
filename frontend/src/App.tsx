import React, { useEffect, useState } from 'react';
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
import LoginView from './views/LoginView';
import ProfileView from './views/ProfileView';
import { Toaster } from 'react-hot-toast';
import './index.css';

// ─── Loading Screen ──────────────────────────────────────────────────────────

const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Initializing secure factory environment…' }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #020c14 0%, #071a26 50%, #020c14 100%)',
    gap: '1.5rem',
  }}>
    {/* Logo */}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="72" height="72">
      <defs>
        <linearGradient id="lgLoad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b0f19"/>
          <stop offset="100%" stopColor="#131a2e"/>
        </linearGradient>
        <linearGradient id="pulseLoad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
        <filter id="glowLoad">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#lgLoad)" stroke="rgba(16,185,129,0.45)" strokeWidth="1.8"/>
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(6,182,212,0.25)" strokeWidth="1.2"/>
      <polyline
        filter="url(#glowLoad)"
        points="8,32 16,32 20,20 24,44 28,26 32,38 36,32 44,32 48,26 52,32 56,32"
        stroke="url(#pulseLoad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="32" cy="32" r="3" fill="#10b981" filter="url(#glowLoad)" opacity="0.9"/>
    </svg>

    <div style={{ textAlign: 'center' }}>
      <h1 style={{
        fontSize: '1.6rem',
        fontWeight: 900,
        background: 'linear-gradient(90deg, #00e68a, #00d4ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: '0 0 0.4rem',
        letterSpacing: '-0.02em',
      }}>
        SMARTFACTORY 360
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500, letterSpacing: '0.08em' }}>
        {message}
      </p>
    </div>

    {/* Animated dots */}
    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e68a, #00d4ff)',
          animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}/>
      ))}
    </div>
  </div>
);

// ─── Session-Expired Banner ──────────────────────────────────────────────────

export const SessionExpiredBanner: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
    background: 'rgba(255,59,106,0.95)',
    padding: '0.85rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 20px rgba(255,59,106,0.4)',
  }}>
    <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
      🔒 Your session has expired. Please log in again.
    </span>
    <button
      onClick={onDismiss}
      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 900 }}
    >✕</button>
  </div>
);

// ─── Protected Route ─────────────────────────────────────────────────────────
//
// Three states:
//   authChecking=true  → show nothing (LoadingScreen is shown at root level)
//   currentUser=null   → redirect to /login
//   currentUser=set    → render children

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useApp();

  if (state.authChecking) {
    // AuthGate is already showing LoadingScreen; return null to avoid flicker
    return null;
  }

  if (!state.currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// ─── Auth Gate ───────────────────────────────────────────────────────────────
//
// Runs once on mount. Validates any stored token against the backend.
// Prevents the Dashboard from rendering before the auth check completes.

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const token = localStorage.getItem('fac_mon_token');
    const savedUser = localStorage.getItem('fac_mon_current_user');

    // No stored credentials → not authenticated, skip network call
    if (!token || !savedUser) {
      dispatch({ type: 'SET_AUTH_CHECKING', payload: false });
      return;
    }

    // Validate the stored token against the backend
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

    fetch(`${BASE_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.user) {
          // Session is still valid — restore user from backend response
          dispatch({
            type: 'SET_USER_SESSION',
            payload: {
              token,
              user: {
                id: data.user.id,
                employeeId: data.user.employeeId,
                fullName: data.user.fullName,
                email: data.user.email,
                role: data.user.role,
                department: data.user.department,
                designation: data.user.designation,
                shift: data.user.shift,
                factoryLocation: data.user.factoryLocation,
              },
            },
          });
        } else {
          // Token rejected by backend — clear everything
          dispatch({ type: 'CLEAR_AUTH' });
        }
      })
      .catch(() => {
        // Backend offline → fall back to stored user (demo/offline mode)
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.fullName && token) {
            // Restore session from localStorage when backend is unreachable
            dispatch({
              type: 'SET_USER_SESSION',
              payload: { token, user: parsed },
            });
          } else {
            dispatch({ type: 'CLEAR_AUTH' });
          }
        } catch {
          dispatch({ type: 'CLEAR_AUTH' });
        }
      })
      .finally(() => {
        dispatch({ type: 'SET_AUTH_CHECKING', payload: false });
      });
  }, []); // run once on mount

  if (state.authChecking) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

// ─── App Routes ──────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => {
  const { state } = useApp();
  const [sessionExpired, setSessionExpired] = useState(false);

  // Global 401 interceptor: if token is rejected while using the app, show banner and redirect
  useEffect(() => {
    const handler = () => {
      setSessionExpired(true);
    };
    window.addEventListener('fac_mon_session_expired', handler);
    return () => window.removeEventListener('fac_mon_session_expired', handler);
  }, []);

  return (
    <>
      {sessionExpired && !state.currentUser && (
        <SessionExpiredBanner onDismiss={() => setSessionExpired(false)} />
      )}
      <div className="app-root">
        <Routes>
          {/* Public route */}
          <Route path="/login" element={
            state.currentUser
              ? <Navigate to="/" replace />
              : <LoginView />
          } />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
          <Route path="/machines" element={<ProtectedRoute><MachinesView /></ProtectedRoute>} />
          <Route path="/machines/:id" element={<ProtectedRoute><MachineDetailView /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><AlertsView /></ProtectedRoute>} />
          <Route path="/sustainability" element={<ProtectedRoute><SustainabilityView /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><MaintenanceInventoryView /></ProtectedRoute>} />
          <Route path="/workers" element={<ProtectedRoute><WorkersView /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentCenterView /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={state.currentUser ? '/' : '/login'} replace />} />
        </Routes>

        {/* ChatAssistant only shown when authenticated */}
        {state.currentUser && <ChatAssistant />}
        
        {/* Global Toast Notifications */}
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
            borderRadius: '8px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' }, duration: 5000 },
        }} />
      </div>
    </>
  );
};

// ─── Root App ────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <AppProvider>
    <BrowserRouter>
      <AuthGate>
        <AppRoutes />
      </AuthGate>
    </BrowserRouter>
  </AppProvider>
);

export default App;
