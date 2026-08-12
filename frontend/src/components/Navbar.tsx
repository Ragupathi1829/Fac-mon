import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AddMachineModal from './AddMachineModal';
import type { UserRole } from '../types/machine';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const activeAlerts = state.alerts.filter(a => !a.resolved).length;

  const fallbackUser = {
    id: 1,
    fullName: 'Ragaav',
    employeeId: 'EMP-1001',
    email: 'admin@factory.com',
    role: 'ADMIN' as UserRole,
    department: 'Executive Board',
    designation: 'Chief Factory Admin',
    shift: 'Morning Shift (06:00 - 14:00)',
    factoryLocation: 'SmartFactory Unit 1 · Chennai',
    profileImage: undefined as string | undefined,
  };

  const user = state.currentUser || fallbackUser;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    dispatch({ type: 'SET_ROLE', payload: newRole });
    
    if (user) {
      dispatch({
        type: 'SET_USER_SESSION',
        payload: {
          token: state.token || '',
          user: {
            ...user,
            role: newRole,
            fullName: newRole === 'ADMIN' ? (state.currentUser?.fullName || 'Ragaav') : newRole === 'FACTORY_MANAGER' ? 'Vikram Manager' : newRole === 'MAINTENANCE_ENGINEER' ? 'Rajesh Engineer' : newRole === 'MACHINE_OPERATOR' ? 'Anand Operator' : 'Meera Inspector',
            email: newRole === 'ADMIN' ? 'admin@factory.com' : newRole === 'FACTORY_MANAGER' ? 'manager@factory.com' : newRole === 'MAINTENANCE_ENGINEER' ? 'engineer@factory.com' : newRole === 'MACHINE_OPERATOR' ? 'operator@factory.com' : 'quality@factory.com',
            employeeId: newRole === 'ADMIN' ? 'EMP-1001' : newRole === 'FACTORY_MANAGER' ? 'EMP-1002' : newRole === 'MAINTENANCE_ENGINEER' ? 'EMP-1003' : newRole === 'MACHINE_OPERATOR' ? 'EMP-1004' : 'EMP-1005',
          }
        }
      });
    }
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  const showTab = (tab: string): boolean => {
    const role = state.activeRole;
    if (tab === 'sustainability') return role === 'FACTORY_MANAGER' || role === 'ADMIN';
    if (tab === 'maintenance') return role === 'MAINTENANCE_ENGINEER' || role === 'FACTORY_MANAGER' || role === 'ADMIN';
    if (tab === 'workers') return role === 'FACTORY_MANAGER' || role === 'ADMIN';
    if (tab === 'documents') return role !== 'QUALITY_INSPECTOR';
    return true;
  };

  return (
    <>
      <nav className="navbar">
        {/* ── Brand Logo with Glow Breathing Effect ── */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="38" height="38" className="navbar-logo-svg">
            <defs>
              <linearGradient id="bgNavFav" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0b0f19"/>
                <stop offset="100%" stopColor="#131a2e"/>
              </linearGradient>
              <linearGradient id="pulseNavFav" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981"/>
                <stop offset="100%" stopColor="#06b6d4"/>
              </linearGradient>
              <filter id="glowNavFav">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <circle cx="32" cy="32" r="30" fill="url(#bgNavFav)" stroke="rgba(16,185,129,0.45)" strokeWidth="1.8"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(6,182,212,0.25)" strokeWidth="1.2"/>
            <polyline
              filter="url(#glowNavFav)"
              points="8,32 16,32 20,20 24,44 28,26 32,38 36,32 44,32 48,26 52,32 56,32"
              stroke="url(#pulseNavFav)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="32" cy="32" r="3" fill="#10b981" filter="url(#glowNavFav)" opacity="0.9"/>
          </svg>

          <div className="navbar-brand-text">
            <span className="navbar-title">SmartFactory 360</span>
            <span className="navbar-subtitle">Live Analytics Suite</span>
          </div>
        </div>

        {/* ── Role-Filtered Navigation Links ── */}
        <div className="navbar-links">
          <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>
            Dashboard
          </button>
          <button className={`nav-link ${isActive('/machines') ? 'active' : ''}`} onClick={() => navigate('/machines')}>
            Machines
          </button>
          <button className={`nav-link ${isActive('/alerts') ? 'active' : ''}`} onClick={() => navigate('/alerts')}>
            Alerts {activeAlerts > 0 && <span className="nav-badge">{activeAlerts}</span>}
          </button>
          
          {showTab('sustainability') && (
            <button className={`nav-link ${isActive('/sustainability') ? 'active' : ''}`} onClick={() => navigate('/sustainability')}>
              Sustainability
            </button>
          )}
          {showTab('maintenance') && (
            <button className={`nav-link ${isActive('/maintenance') ? 'active' : ''}`} onClick={() => navigate('/maintenance')}>
              Maintenance
            </button>
          )}
          {showTab('workers') && (
            <button className={`nav-link ${isActive('/workers') ? 'active' : ''}`} onClick={() => navigate('/workers')}>
              Workers
            </button>
          )}
          {showTab('documents') && (
            <button className={`nav-link ${isActive('/documents') ? 'active' : ''}`} onClick={() => navigate('/documents')}>
              Documents
            </button>
          )}
        </div>

        {/* ── Right Side Action Pills & Top-Right Profile Pill ── */}
        <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', position: 'relative' }}>
          {/* Add Machine Button for Admin/Manager */}
          {(state.activeRole === 'ADMIN' || state.activeRole === 'FACTORY_MANAGER' || state.activeRole === 'MAINTENANCE_ENGINEER') && (
            <button 
              className="btn-add-machine"
              onClick={() => setShowAddModal(true)}
              style={{ background: 'rgba(255,59,106,0.1)', border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)', whiteSpace: 'nowrap' }}
            >
              ➕ Add Machine
            </button>
          )}

          {/* Role Switcher */}
          <select 
            value={state.activeRole} 
            onChange={handleRoleChange}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '30px',
              fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
              fontWeight: 600, whiteSpace: 'nowrap'
            }}
          >
            <option value="ADMIN" style={{ background: '#09262f', color: '#ffffff' }}>👑 Admin</option>
            <option value="FACTORY_MANAGER" style={{ background: '#09262f', color: '#ffffff' }}>🏭 Factory Manager</option>
            <option value="MAINTENANCE_ENGINEER" style={{ background: '#09262f', color: '#ffffff' }}>🔧 Engineer</option>
            <option value="MACHINE_OPERATOR" style={{ background: '#09262f', color: '#ffffff' }}>⚙️ Operator</option>
            <option value="QUALITY_INSPECTOR" style={{ background: '#09262f', color: '#ffffff' }}>🔬 Inspector</option>
          </select>

          {/* ✦ TOP-RIGHT PROFILE PILL ✦ */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile Avatar"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #00e68a' }}
                />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e68a, #00d4ff)', color: '#000', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'R'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span style={{ color: '#ffffff', fontSize: '0.78rem', fontWeight: 800 }}>
                  {user.fullName ? user.fullName.split(' ')[0] : 'Ragupathi'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                  {state.activeRole === 'ADMIN' ? 'Admin' : state.activeRole === 'FACTORY_MANAGER' ? 'Factory Manager' : state.activeRole === 'MAINTENANCE_ENGINEER' ? 'Engineer' : state.activeRole === 'MACHINE_OPERATOR' ? 'Operator' : 'Inspector'}
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: '0.2rem' }}>
                {showProfileMenu ? '▲' : '▼'}
              </span>
            </button>

            {/* ✦ FLYOUT DROPDOWN MENU ✦ */}
            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: '230px',
                  background: '#0a232b',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '16px',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,212,255,0.1)',
                  padding: '1rem',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  animation: 'modal-slide-in 0.2s ease-out'
                }}
              >
                {/* Header Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Avatar"
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #00e68a' }}
                    />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e68a, #00d4ff)', color: '#000', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'R'}
                    </div>
                  )}
                  <div>
                    <h4 style={{ color: '#ffffff', fontSize: '0.88rem', fontWeight: 800, margin: 0 }}>{user.fullName}</h4>
                    <p style={{ color: '#00d4ff', fontSize: '0.7rem', margin: '0.1rem 0' }}>{user.employeeId || 'EMP-1001'}</p>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{state.activeRole}</span>
                  </div>
                </div>

                {/* Dropdown Items */}
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: '10px', background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, width: '100%', textAlign: 'left' }}
                  onClick={() => {
                    dispatch({ type: 'SET_PROFILE_TAB', payload: 'personal' });
                    setShowProfileMenu(false);
                    navigate('/profile?tab=personal');
                  }}
                >
                  👤 My Profile
                </button>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: '10px', background: 'rgba(255,59,106,0.15)', color: '#ff3b6a', border: '1px solid rgba(255,59,106,0.3)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800, width: '100%', textAlign: 'left' }}
                    onClick={handleLogout}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Add Machine Modal Overlay */}
      {showAddModal && <AddMachineModal onClose={() => setShowAddModal(false)} />}
    </>
  );
};

export default Navbar;
