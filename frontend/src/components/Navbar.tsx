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
      <nav className="navbar navbar-modern">
        {/* ── Brand Logo with Glow Breathing Effect ── */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="navbar-logo-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="36" height="36" className="navbar-logo-svg">
              <defs>
                <linearGradient id="bgNavFav" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#081820"/>
                  <stop offset="100%" stopColor="#0d2834"/>
                </linearGradient>
                <linearGradient id="pulseNavFav" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00e68a"/>
                  <stop offset="100%" stopColor="#00d4ff"/>
                </linearGradient>
                <filter id="glowNavFav">
                  <feGaussianBlur stdDeviation="1.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <circle cx="32" cy="32" r="30" fill="url(#bgNavFav)" stroke="rgba(0,230,138,0.4)" strokeWidth="1.8"/>
              <circle cx="32" cy="32" r="25" fill="none" stroke="rgba(0,212,255,0.2)" strokeWidth="1.2"/>
              <polyline
                filter="url(#glowNavFav)"
                points="8,32 16,32 20,20 24,44 28,26 32,38 36,32 44,32 48,26 52,32 56,32"
                stroke="url(#pulseNavFav)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="32" cy="32" r="3" fill="#00e68a" filter="url(#glowNavFav)"/>
            </svg>
            <span className="navbar-live-dot" />
          </div>

          <div className="navbar-brand-text">
            <span className="navbar-title">SmartFactory 360</span>
            <span className="navbar-subtitle">Industry 4.0 Live Suite</span>
          </div>
        </div>

        {/* ── Role-Filtered Navigation Links (Floating Glass Pill Strip) ── */}
        <div className="navbar-links-dock">
          <button className={`nav-link-dock ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button className={`nav-link-dock ${isActive('/machines') ? 'active' : ''}`} onClick={() => navigate('/machines')}>
            <span className="nav-icon">⚙️</span>
            <span>Machines</span>
          </button>
          <button className={`nav-link-dock ${isActive('/alerts') ? 'active' : ''}`} onClick={() => navigate('/alerts')}>
            <span className="nav-icon">🔔</span>
            <span>Alerts</span>
            {activeAlerts > 0 && (
              <span className="nav-badge-pulse">
                <span className="pulse-ping" />
                {activeAlerts}
              </span>
            )}
          </button>
          
          {showTab('sustainability') && (
            <button className={`nav-link-dock ${isActive('/sustainability') ? 'active' : ''}`} onClick={() => navigate('/sustainability')}>
              <span className="nav-icon">🌱</span>
              <span>Sustainability</span>
            </button>
          )}
          {showTab('maintenance') && (
            <button className={`nav-link-dock ${isActive('/maintenance') ? 'active' : ''}`} onClick={() => navigate('/maintenance')}>
              <span className="nav-icon">🔧</span>
              <span>Maintenance</span>
            </button>
          )}
          {showTab('workers') && (
            <button className={`nav-link-dock ${isActive('/workers') ? 'active' : ''}`} onClick={() => navigate('/workers')}>
              <span className="nav-icon">👥</span>
              <span>Workers</span>
            </button>
          )}
          {showTab('documents') && (
            <button className={`nav-link-dock ${isActive('/documents') ? 'active' : ''}`} onClick={() => navigate('/documents')}>
              <span className="nav-icon">📂</span>
              <span>Documents</span>
            </button>
          )}
        </div>

        {/* ── Right Side Action Pills & Profile ── */}
        <div className="navbar-right-controls">
          {/* Add Machine Button */}
          {(state.activeRole === 'ADMIN' || state.activeRole === 'FACTORY_MANAGER' || state.activeRole === 'MAINTENANCE_ENGINEER') && (
            <button 
              className="btn-dock-add"
              onClick={() => setShowAddModal(true)}
              title="Add New Machine"
            >
              <span className="btn-add-icon">＋</span>
              <span className="btn-add-text">Add Machine</span>
            </button>
          )}

          {/* Role Switcher */}
          <div className="role-select-wrapper">
            <select 
              value={state.activeRole} 
              onChange={handleRoleChange}
              className="role-selector-modern"
              aria-label="Switch User Role"
            >
              <option value="ADMIN">👑 Admin</option>
              <option value="FACTORY_MANAGER">🏭 Manager</option>
              <option value="MAINTENANCE_ENGINEER">🔧 Engineer</option>
              <option value="MACHINE_OPERATOR">⚙️ Operator</option>
              <option value="QUALITY_INSPECTOR">🔬 Inspector</option>
            </select>
          </div>

          {/* ✦ Top-Right Profile Pill ✦ */}
          <div className="profile-pill-wrapper">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`profile-pill-button ${showProfileMenu ? 'active' : ''}`}
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Avatar"
                  className="profile-pill-avatar"
                />
              ) : (
                <div className="profile-pill-initial">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'R'}
                </div>
              )}
              <div className="profile-pill-info">
                <span className="profile-pill-name">
                  {user.fullName ? user.fullName.split(' ')[0] : 'User'}
                </span>
                <span className="profile-pill-role">
                  {state.activeRole === 'ADMIN' ? 'Admin' : state.activeRole === 'FACTORY_MANAGER' ? 'Manager' : state.activeRole === 'MAINTENANCE_ENGINEER' ? 'Engineer' : state.activeRole === 'MACHINE_OPERATOR' ? 'Operator' : 'Inspector'}
                </span>
              </div>
              <span className={`profile-pill-arrow ${showProfileMenu ? 'open' : ''}`}>▾</span>
            </button>

            {/* Flyout Menu */}
            {showProfileMenu && (
              <div className="profile-menu-dropdown">
                <div className="profile-menu-header">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Avatar"
                      className="profile-menu-avatar"
                    />
                  ) : (
                    <div className="profile-menu-initial">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'R'}
                    </div>
                  )}
                  <div className="profile-menu-details">
                    <h4 className="profile-menu-fullname">{user.fullName}</h4>
                    <p className="profile-menu-empid">{user.employeeId || 'EMP-1001'}</p>
                    <span className="profile-menu-badgerole">{state.activeRole}</span>
                  </div>
                </div>

                <div className="profile-menu-items">
                  <button
                    className="profile-menu-item item-profile"
                    onClick={() => {
                      dispatch({ type: 'SET_PROFILE_TAB', payload: 'personal' });
                      setShowProfileMenu(false);
                      navigate('/profile?tab=personal');
                    }}
                  >
                    <span>👤</span> My Profile & Preferences
                  </button>

                  <button
                    className="profile-menu-item item-logout"
                    onClick={handleLogout}
                  >
                    <span>🚪</span> Sign Out
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

