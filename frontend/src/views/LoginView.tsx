import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/api';
import type { UserRole } from '../types/machine';
import RegisterModal from '../components/RegisterModal';

const ROLE_PRESETS = [
  { label: '👑 Admin', email: 'admin@factory.com', pass: 'admin123', role: 'ADMIN' as UserRole, title: 'Chief System Admin' },
  { label: '🏭 Factory Manager', email: 'manager@factory.com', pass: 'manager123', role: 'FACTORY_MANAGER' as UserRole, title: 'Plant General Manager' },
  { label: '🔧 Maintenance Engineer', email: 'engineer@factory.com', pass: 'engineer123', role: 'MAINTENANCE_ENGINEER' as UserRole, title: 'Senior Reliability Engineer' },
  { label: '⚙️ Machine Operator', email: 'operator@factory.com', pass: 'operator123', role: 'MACHINE_OPERATOR' as UserRole, title: 'Senior Machine Specialist' },
  { label: '🔬 Quality Inspector', email: 'quality@factory.com', pass: 'quality123', role: 'QUALITY_INSPECTOR' as UserRole, title: 'Chief Quality Auditor' },
];

const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [email, setEmail] = useState('admin@factory.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both employee email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login(email, password);
      // Dispatch authentication payload
      dispatch({
        type: 'SET_USER_SESSION',
        payload: {
          token: res.token,
          user: {
            id: res.id,
            employeeId: res.employeeId,
            fullName: res.fullName,
            email: res.email,
            role: res.role,
            department: res.department,
            designation: res.designation,
            shift: res.shift,
            factoryLocation: res.factoryLocation,
          }
        }
      });

      // Role-based redirection
      switch (res.role) {
        case 'ADMIN':
          navigate('/');
          break;
        case 'FACTORY_MANAGER':
          navigate('/');
          break;
        case 'MAINTENANCE_ENGINEER':
          navigate('/machines');
          break;
        case 'MACHINE_OPERATOR':
          navigate('/machines/1');
          break;
        case 'QUALITY_INSPECTOR':
          navigate('/');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Invalid employee credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    setError(null);
  };

  return (
    <div className="login-root">
      <div className="login-card">
        {/* Header Branding with Exact favicon.svg Logo */}
        <div className="login-header">
          <div className="login-logo-circle" style={{ width: '72px', height: '72px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="72" height="72">
              <defs>
                <linearGradient id="bgFav" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0b0f19"/>
                  <stop offset="100%" stopColor="#131a2e"/>
                </linearGradient>
                <linearGradient id="pulseFav" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
                <filter id="glowFav">
                  <feGaussianBlur stdDeviation="1.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <circle cx="32" cy="32" r="30" fill="url(#bgFav)" stroke="rgba(16,185,129,0.45)" strokeWidth="1.8"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(6,182,212,0.25)" strokeWidth="1.2"/>
              <polyline
                filter="url(#glowFav)"
                points="8,32 16,32 20,20 24,44 28,26 32,38 36,32 44,32 48,26 52,32 56,32"
                stroke="url(#pulseFav)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="32" cy="32" r="3" fill="#10b981" filter="url(#glowFav)" opacity="0.9"/>
            </svg>
          </div>
          <h2>SmartFactory 360</h2>
          <p className="login-subtitle">Industry 4.0 IoT & Machine Analytics Portal</p>
        </div>

        {/* Quick Role Selector for Demo Testing */}
        <div className="preset-role-bar">
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
            ⚡ SELECT FACTORY ROLE TO DEMO:
          </span>
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {ROLE_PRESETS.map(preset => (
              <button
                key={preset.role}
                type="button"
                className={`filter-tab ${email === preset.email ? 'active' : ''}`}
                style={{ fontSize: '0.68rem', padding: '0.25rem 0.6rem', borderRadius: '12px' }}
                onClick={() => selectPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="login-error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Employee Email / ID</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. admin@factory.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Security Password</span>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#00d4ff', fontSize: '0.72rem', cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈 Hide' : '👁️ Show'}
              </button>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0 1.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: '#00e68a' }}
              />
              Remember Employee Session
            </label>

            <a href="#" onClick={(e) => { e.preventDefault(); alert('Please contact Plant IT Desk (ext. 404) to reset factory passkey.'); }} style={{ fontSize: '0.72rem', color: '#00d4ff', textDecoration: 'none' }}>
              Forgot Password?
            </a>
          </div>

          <button className="btn-submit" type="submit" disabled={loading} style={{ height: '46px', fontSize: '0.9rem', fontWeight: 800 }}>
            {loading ? '🔐 Authenticating JWT Credentials…' : '🚀 Sign In to Factory Dashboard'}
          </button>
        </form>

        {/* Login Footer & Register Link */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>New worker or team member? </span>
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            style={{ background: 'none', border: 'none', color: '#00e68a', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Create Worker Account
          </button>
        </div>

        <div className="login-footer">
          <span>SmartFactory 360 Enterprise v4.2 • Protected by Spring Security & JWT</span>
        </div>
      </div>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(newUser) => {
          // Register and immediately log in as the newly registered worker
          dispatch({
            type: 'SET_USER_SESSION',
            payload: {
              token: `JWT_BEARER_MOCK_TOKEN_${newUser.role}`,
              user: newUser,
            }
          });
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
          navigate('/');
        }}
      />
    </div>
  );
};

export default LoginView;
