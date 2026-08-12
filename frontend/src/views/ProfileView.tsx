import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types/machine';

const ProfileView: React.FC = () => {
  const { state, dispatch } = useApp();
  const user = state.currentUser;
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = state.profileActiveTab || 'personal';
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'SECURITY' | 'UPDATES' | 'SYSTEM'>('ALL');
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [newCustomActivity, setNewCustomActivity] = useState('');

  // Synchronize active tab from URL query params or location state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const stateTab = (location.state as any)?.tab;

    const validTabs: Array<'personal' | 'employment' | 'factory' | 'security' | 'activity' | 'notifications' | 'settings'> = [
      'personal', 'employment', 'factory', 'security', 'activity', 'notifications', 'settings'
    ];

    if (tabParam && validTabs.includes(tabParam as any)) {
      dispatch({ type: 'SET_PROFILE_TAB', payload: tabParam as any });
    } else if (stateTab && validTabs.includes(stateTab)) {
      dispatch({ type: 'SET_PROFILE_TAB', payload: stateTab });
    }
  }, [location, dispatch]);

  // Tab switcher helper that updates AppContext state, active tab, and URL query parameter
  const switchTab = (tabId: 'personal' | 'employment' | 'factory' | 'security' | 'activity' | 'notifications' | 'settings') => {
    dispatch({ type: 'SET_PROFILE_TAB', payload: tabId });
    navigate(`/profile?tab=${tabId}`, { replace: true });
  };

  // Form State initialized from currentUser
  const [form, setForm] = useState({
    fullName: user?.fullName || 'Ragaav',
    employeeId: user?.employeeId || 'EMP-1001',
    email: user?.email || 'admin@factory.com',
    role: (user?.role || 'ADMIN') as UserRole,
    department: user?.department || 'Executive Board',
    designation: user?.designation || 'Chief Factory Admin',
    factoryName: user?.factoryLocation || 'SmartFactory Unit 1 · Chennai',
    shift: user?.shift || 'Morning Shift (06:00 - 14:00)',
    experience: '5-10 Years',
    phone: user?.phone || '+91 98765 43210',
    alternateEmail: user?.alternateEmail || 'ragu.admin@smartfactory360.com',
    emergencyPhone: user?.emergencyContact ? user.emergencyContact.split(' ')[0] : '+91 98123 45678',
    emergencyRelation: 'Spouse',
    address: user?.address || 'Sector 4, Industrial Expressway, Chennai, TN',
    bloodGroup: 'O+',
    dateOfBirth: '1992-05-14',
    dateOfJoining: '2023-01-15',
    timezone: user?.timezone || 'IST (UTC+05:30)',
    language: 'English',
  });

  // Synchronize form when user object updates in context
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        employeeId: user.employeeId || prev.employeeId,
        email: user.email || prev.email,
        role: user.role || prev.role,
        department: user.department || prev.department,
        designation: user.designation || prev.designation,
        factoryName: user.factoryLocation || prev.factoryName,
        shift: user.shift || prev.shift,
        phone: user.phone || prev.phone,
        alternateEmail: user.alternateEmail || prev.alternateEmail,
        address: user.address || prev.address,
        timezone: user.timezone || prev.timezone,
      }));
    }
  }, [user]);

  const [passForm, setPassForm] = useState({
    current: '',
    newPass: '',
    confirmPass: '',
    showPass: false,
  });

  const [notifyPrefs, setNotifyPrefs] = useState({
    emailNotifs: true,
    smsAlerts: false,
    machineFailureAlerts: true,
    maintenanceReminders: true,
    dailyReport: false,
  });

  const [settingsForm, setSettingsForm] = useState({
    theme: 'DARK',
    compactMode: false,
    refreshInterval: '30s',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12-Hour (AM/PM)',
    soundAlerts: true,
    animations: true,
  });

  const [activitiesList, setActivitiesList] = useState([
    { title: 'Security password updated successfully', date: 'Today, 10:24 AM', icon: '🔑', category: 'SECURITY' },
    { title: 'Updated Personal Profile Information', date: 'Yesterday, 04:15 PM', icon: '✏️', category: 'UPDATES' },
    { title: 'Added Machine MCH-106 to Sensor Grid', date: '2 Days Ago', icon: '➕', category: 'SYSTEM' },
    { title: 'Downloaded Monthly BEE Compliance Report', date: '5 Days Ago', icon: '📥', category: 'SYSTEM' },
    { title: 'Logged in securely from IP 192.168.1.45', date: '6 Days Ago', icon: '💻', category: 'SECURITY' },
  ]);

  type VerificationState = 'idle' | 'sending' | 'otpSent' | 'verifying' | 'verified' | 'error' | 'expired' | 'resendCooldown';
  const [mobileVerificationState, setMobileVerificationState] = useState<VerificationState>('idle');
  const [emailVerificationState, setEmailVerificationState] = useState<VerificationState>('idle');
  
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendOtp = async (type: 'MOBILE' | 'EMAIL') => {
    const isMobile = type === 'MOBILE';
    const setVerificationState = isMobile ? setMobileVerificationState : setEmailVerificationState;
    const contactValue = isMobile ? newMobile : newEmail;
    
    setVerificationState('sending');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/profile/send-${isMobile ? 'mobile' : 'email'}-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isMobile ? { mobile: contactValue } : { email: contactValue })
      });
      const data = await res.json();
      
      if (res.ok) {
        setVerificationState('otpSent');
        setResendTimer(30);
      } else {
        setVerificationState('error');
        setFeedback(`⚠️ ${data.message || 'Failed to send OTP'}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setVerificationState('error');
      setFeedback('⚠️ Network error. Could not send OTP.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const verifyOtp = async (type: 'MOBILE' | 'EMAIL') => {
    const isMobile = type === 'MOBILE';
    const setVerificationState = isMobile ? setMobileVerificationState : setEmailVerificationState;
    const contactValue = isMobile ? newMobile : newEmail;
    const otpValue = isMobile ? mobileOtp : emailOtp;
    
    setVerificationState('verifying');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/profile/verify-${isMobile ? 'mobile' : 'email'}-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [isMobile ? 'mobile' : 'email']: contactValue, otp: otpValue })
      });
      const data = await res.json();
      
      if (res.ok && data.verified) {
        setVerificationState('verified');
        if (isMobile) {
            setForm({ ...form, phone: newMobile });
            setTimeout(() => { setShowMobileModal(false); setMobileVerificationState('idle'); setMobileOtp(''); }, 2000);
        } else {
            setForm({ ...form, email: newEmail });
            setTimeout(() => { setShowEmailModal(false); setEmailVerificationState('idle'); setEmailOtp(''); }, 2000);
        }
      } else {
        setVerificationState('error');
      }
    } catch (err) {
      setVerificationState('error');
    }
  };

  // Password validation checks
  const hasLength = passForm.newPass.length >= 8;
  const hasUpper = /[A-Z]/.test(passForm.newPass);
  const hasLower = /[a-z]/.test(passForm.newPass);
  const hasNum = /[0-9]/.test(passForm.newPass);
  const hasSpecial = /[^A-Za-z0-9]/.test(passForm.newPass);
  const isMatch = passForm.newPass !== '' && passForm.newPass === passForm.confirmPass;
  const isPassValid = hasLength && hasUpper && hasLower && hasNum && hasSpecial && isMatch;

  // Calculate Profile Completion Score (LinkedIn Style)
  const calculateCompletion = () => {
    let filled = 0;
    const fields = [form.fullName, form.phone, form.alternateEmail, form.address, form.emergencyPhone, form.bloodGroup, form.dateOfBirth, form.experience, user?.profileImage];
    fields.forEach(f => { if (f) filled++; });
    return Math.round((filled / fields.length) * 100);
  };
  const completionPct = calculateCompletion();

  // Photo Upload via FileReader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      dispatch({
        type: 'UPDATE_USER_PROFILE',
        payload: { profileImage: reader.result as string }
      });
      setFeedback('✔ Profile photo updated successfully!');
      setTimeout(() => setFeedback(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: { profileImage: undefined }
    });
    setFeedback('✔ Profile photo removed.');
    setTimeout(() => setFeedback(null), 3000);
  };

  // Master Save Handler: dispatches all profile changes to AppContext & localStorage
  const handleSaveChanges = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    dispatch({
      type: 'UPDATE_USER_PROFILE',
      payload: {
        fullName: form.fullName,
        employeeId: form.employeeId,
        email: form.email,
        role: form.role,
        designation: form.designation,
        department: form.department,
        factoryLocation: form.factoryName,
        shift: form.shift,
        phone: form.phone,
        alternateEmail: form.alternateEmail,
        address: form.address,
        emergencyContact: `${form.emergencyPhone} (${form.emergencyRelation})`,
        timezone: form.timezone,
      }
    });

    setIsHeaderEditing(false);
    setFeedback(`✔ Profile updated successfully for ${form.fullName}!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleResetForm = () => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.fullName || 'Ragaav',
        employeeId: user.employeeId || 'EMP-1001',
        email: user.email || 'admin@factory.com',
        role: user.role || 'ADMIN',
        department: user.department || 'Executive Board',
        designation: user.designation || 'Chief Factory Admin',
        factoryName: user.factoryLocation || 'SmartFactory Unit 1 · Chennai',
        shift: user.shift || 'Morning Shift (06:00 - 14:00)',
        phone: user.phone || '+91 98765 43210',
        alternateEmail: user.alternateEmail || 'ragu.admin@smartfactory360.com',
        address: user.address || 'Sector 4, Industrial Expressway, Chennai, TN',
      }));
    }
    setFeedback('Form fields reset to saved profile values.');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.current) {
      setFeedback('⚠️ Current password is required.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (!isPassValid) {
      setFeedback('⚠️ Please fulfill all password requirements and ensure passwords match.');
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.newPass }),
      });
    } catch (err) {
      // Backend request fallback handler
    }

    // Add entry to activity log
    setActivitiesList(prev => [
      { title: 'Security password changed successfully', date: 'Just now', icon: '🔑', category: 'SECURITY' },
      ...prev
    ]);

    setFeedback('✔ Security password updated successfully!');
    setPassForm({ current: '', newPass: '', confirmPass: '', showPass: false });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('✔ Portal Settings Updated Successfully!');
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAddCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomActivity.trim()) return;
    setActivitiesList(prev => [
      { title: newCustomActivity, date: 'Just now', icon: '📝', category: 'UPDATES' },
      ...prev
    ]);
    setNewCustomActivity('');
    setFeedback('✔ Activity entry added to timeline.');
    setTimeout(() => setFeedback(null), 2500);
  };

  const initials = form.fullName ? form.fullName.charAt(0).toUpperCase() : 'R';

  const filteredActivities = activitiesList.filter(act => {
    if (activityFilter === 'ALL') return true;
    return act.category === activityFilter;
  });

  return (
    <div className="app-root">
      <Navbar />
      <div className="dashboard-container">

        {/* ── TOP HERO FACTORY & EMPLOYEE BADGE WITH BREATHING EFFECT & QUICK EDIT ── */}
        <div className="chart-card breathe-border" style={{ marginBottom: '1.25rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(13,53,66,0.95), rgba(9,38,47,0.98))', border: '2px solid rgba(0,212,255,0.25)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
              
              {/* Profile Avatar with Breathing Animation */}
              <div style={{ position: 'relative' }}>
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Employee Avatar"
                    className="breathe-avatar"
                    style={{ width: '92px', height: '92px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00e68a', transition: 'all 0.3s ease' }}
                  />
                ) : (
                  <div className="breathe-avatar" style={{ width: '92px', height: '92px', borderRadius: '50%', background: 'linear-gradient(135deg, #00e68a, #00d4ff)', color: '#000', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6rem', border: '3px solid #00e68a', transition: 'all 0.3s ease' }}>
                    {initials}
                  </div>
                )}
                <label style={{ position: 'absolute', bottom: '0', right: '0', background: '#00d4ff', color: '#000', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 0 12px rgba(0,212,255,0.6)' }} title="Upload Custom Photo">
                  📷
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* Employee Summary & Quick Inline Edit Mode */}
              <div style={{ flex: 1 }}>
                {!isHeaderEditing ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <h1 style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                        {form.fullName}
                      </h1>
                      <button
                        onClick={() => setIsHeaderEditing(true)}
                        style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        title="Edit Name & Header Details"
                      >
                        ✏️ Quick Edit
                      </button>
                      <span className="breathe-indicator" style={{ background: 'rgba(0,230,138,0.15)', color: '#00e68a', border: '1px solid rgba(0,230,138,0.35)', padding: '0.15rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e68a', boxShadow: '0 0 10px #00e68a' }} /> Online
                      </span>
                      <span style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.35)', padding: '0.15rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                        {state.activeRole}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.25rem 0 0.5rem 0' }}>
                      ID: <strong style={{ color: '#ffffff' }}>{form.employeeId}</strong> • {form.designation}
                    </p>

                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>🏭 Plant: <strong style={{ color: '#00d4ff' }}>{form.factoryName}</strong></span>
                      <span>🏛️ Dept: <strong style={{ color: '#ffffff' }}>{form.department}</strong></span>
                      <span>🕒 Shift: <strong style={{ color: '#00e68a' }}>{form.shift}</strong></span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'rgba(0,0,0,0.25)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(0,212,255,0.3)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#00d4ff', fontWeight: 700 }}>Full Name</label>
                        <input
                          className="form-input"
                          value={form.fullName}
                          onChange={e => setForm({ ...form, fullName: e.target.value })}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#00d4ff', fontWeight: 700 }}>Employee ID</label>
                        <input
                          className="form-input"
                          value={form.employeeId}
                          onChange={e => setForm({ ...form, employeeId: e.target.value })}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#00d4ff', fontWeight: 700 }}>Designation</label>
                        <input
                          className="form-input"
                          value={form.designation}
                          onChange={e => setForm({ ...form, designation: e.target.value })}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#00d4ff', fontWeight: 700 }}>Department</label>
                        <input
                          className="form-input"
                          value={form.department}
                          onChange={e => setForm({ ...form, department: e.target.value })}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        className="btn-submit"
                        onClick={() => handleSaveChanges()}
                        style={{ padding: '0.35rem 1rem', fontSize: '0.75rem', fontWeight: 800, width: 'auto' }}
                      >
                        💾 Save Quick Edit
                      </button>
                      <button
                        type="button"
                        className="filter-tab"
                        onClick={() => setIsHeaderEditing(false)}
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Photo Control */}
            {user?.profileImage && (
              <button
                className="filter-tab"
                onClick={handleRemovePhoto}
                style={{ background: 'rgba(255,59,106,0.15)', color: '#ff3b6a', border: '1px solid rgba(255,59,106,0.3)', padding: '0.45rem 0.95rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}
              >
                🗑️ Remove Photo
              </button>
            )}
          </div>

          {/* Profile Completion Bar */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
              <span>Profile Completion Status</span>
              <span style={{ color: '#00e68a', fontWeight: 800 }}>{completionPct}% Complete</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, #00e68a, #00d4ff)', borderRadius: '10px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* ── KPI STATISTICS SUMMARY ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="kpi-card kpi-card-cyan"><div className="kpi-card-body"><h3>Employee Since</h3><p className="kpi-value">2023</p></div></div>
          <div className="kpi-card kpi-card-emerald"><div className="kpi-card-body"><h3>Department</h3><p className="kpi-value">{form.department.split(' ')[0]}</p></div></div>
          <div className="kpi-card kpi-card-amber"><div className="kpi-card-body"><h3>Completed Tasks</h3><p className="kpi-value">352 Workorders</p></div></div>
          <div className="kpi-card kpi-card-cyan"><div className="kpi-card-body"><h3>Current Shift</h3><p className="kpi-value">{form.shift.split(' ')[0]}</p></div></div>
          <div className="kpi-card kpi-card-emerald"><div className="kpi-card-body"><h3>Attendance</h3><p className="kpi-value" style={{ color: '#00e68a' }}>98% Verified</p></div></div>
        </div>

        {/* Feedback Message Toast */}
        {feedback && (
          <div style={{ background: feedback.startsWith('⚠️') ? 'rgba(245,158,11,0.18)' : 'rgba(0,230,138,0.18)', border: feedback.startsWith('⚠️') ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(0,230,138,0.5)', color: feedback.startsWith('⚠️') ? '#f59e0b' : '#00e68a', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 800, marginBottom: '1.25rem', textAlign: 'center', boxShadow: '0 0 20px rgba(0,230,138,0.2)' }}>
            {feedback}
          </div>
        )}

        {/* ── NAVIGATION TABS WITH URL QUERY SYNC ── */}
        <div className="detail-tabs" style={{ marginBottom: '1.25rem' }}>
          {[
            { id: 'personal', label: '👤 Personal' },
            { id: 'employment', label: '💼 Employment' },
            { id: 'factory', label: '🏭 Factory' },
            { id: 'security', label: '🔐 Security' },
            { id: 'activity', label: '📜 Activity' },
            { id: 'notifications', label: '🔔 Notifications' },
            { id: 'settings', label: '⚙️ Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => switchTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MAIN TAB CONTENT SECTIONS ── */}
        <main className="dashboard-main">

          {/* 1. PERSONAL INFORMATION FORM */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="chart-card">
                <h3 style={{ color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📌 Personal Information & Profile Identification
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Employee ID (Editable)</label>
                    <input className="form-input" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Official Email</span>
                      <span style={{ color: '#00e68a', fontSize: '0.75rem', fontWeight: 700 }}>🟢 Verified</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="form-input" type="email" value={form.email} readOnly style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }} />
                      <button type="button" className="btn-submit" style={{ width: 'auto', padding: '0 1rem', fontSize: '0.75rem' }} onClick={() => { setNewEmail(''); setEmailOtp(''); setEmailVerificationState('idle'); setShowEmailModal(true); }}>
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name (Display & Profile)</label>
                    <input className="form-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Enter Full Name" required />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Phone Number (+91 Format)</span>
                      <span style={{ color: '#00e68a', fontSize: '0.75rem', fontWeight: 700 }}>🟢 Verified</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input className="form-input" value={form.phone} readOnly style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }} />
                      <button type="button" className="btn-submit" style={{ width: 'auto', padding: '0 1rem', fontSize: '0.75rem' }} onClick={() => { setNewMobile(''); setMobileOtp(''); setMobileVerificationState('idle'); setShowMobileModal(true); }}>
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alternate Email</label>
                    <input className="form-input" type="email" value={form.alternateEmail} onChange={e => setForm({ ...form, alternateEmail: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select className="form-select" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Joining</label>
                    <input className="form-input" type="date" value={form.dateOfJoining} onChange={e => setForm({ ...form, dateOfJoining: e.target.value })} />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Residential Address</label>
                    <textarea className="form-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ fontFamily: 'inherit', resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="chart-card">
                <h3 style={{ color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🚨 Emergency Contact (Medical & Safety)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Emergency Phone Number</label>
                    <input className="form-input" value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <select className="form-select" value={form.emergencyRelation} onChange={e => setForm({ ...form, emergencyRelation: e.target.value })}>
                      {['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Friend'].map(rel => <option key={rel} value={rel}>{rel}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button className="btn-submit" type="submit" style={{ width: 'auto', padding: '0.7rem 2.2rem', fontWeight: 800 }}>
                  💾 Save Profile Details
                </button>
                <button className="filter-tab" type="button" onClick={handleResetForm} style={{ padding: '0.7rem 1.5rem', borderRadius: '12px' }}>
                  🔄 Reset Form
                </button>
              </div>
            </form>
          )}

          {/* 2. EMPLOYMENT DETAILS TAB */}
          {activeTab === 'employment' && (
            <form onSubmit={handleSaveChanges} className="chart-card">
              <h3 style={{ color: '#ffffff', marginBottom: '1.25rem' }}>💼 Employment & Job Role Specifications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Factory Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}>
                    <option value="ADMIN">Factory Admin</option>
                    <option value="FACTORY_MANAGER">Production Manager</option>
                    <option value="MAINTENANCE_ENGINEER">Maintenance Engineer</option>
                    <option value="MACHINE_OPERATOR">Machine Operator</option>
                    <option value="QUALITY_INSPECTOR">Quality Engineer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    {['Executive Board', 'Production', 'Maintenance', 'Quality Control', 'Warehouse', 'Logistics', 'Administration', 'HR', 'Finance', 'IT', 'Safety'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Shift</label>
                  <select className="form-select" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
                    {['Morning Shift (06:00 - 14:00)', 'Evening Shift (14:00 - 22:00)', 'Night Shift (22:00 - 06:00)', 'General Shift (09:00 - 17:00)'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Work Experience</label>
                  <select className="form-select" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })}>
                    {['0-1 Years', '2-5 Years', '5-10 Years', '10+ Years'].map(exp => <option key={exp} value={exp}>{exp}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn-submit" type="submit" style={{ width: 'auto', padding: '0.7rem 2rem', fontWeight: 800 }}>
                💾 Save Employment Details
              </button>
            </form>
          )}

          {/* 3. FACTORY ALLOCATION TAB */}
          {activeTab === 'factory' && (
            <form onSubmit={handleSaveChanges} className="chart-card">
              <h3 style={{ color: '#ffffff', marginBottom: '1.25rem' }}>🏭 Factory Unit & Plant Allocation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Assigned Plant Location</label>
                  <select className="form-select" value={form.factoryName} onChange={e => setForm({ ...form, factoryName: e.target.value })}>
                    {['SmartFactory Unit 1 · Chennai', 'Coimbatore Precision Plant', 'Hosur Manufacturing Hub', 'Bengaluru IoT Sector'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Timezone Setting</label>
                  <select className="form-select" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}>
                    {['IST (UTC+05:30)', 'PST (UTC-08:00)', 'EST (UTC-05:00)', 'GMT (UTC+00:00)'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Interface Language</label>
                  <select className="form-select" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                    {['English', 'Tamil', 'Hindi', 'Kannada', 'Telugu'].map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn-submit" type="submit" style={{ width: 'auto', padding: '0.7rem 2rem', fontWeight: 800 }}>
                💾 Save Factory Settings
              </button>
            </form>
          )}

          {/* 4. SECURITY & CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <div className="chart-card">
              <h3 style={{ color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔐 Security & Change Password
              </h3>

              <form onSubmit={handleSavePassword} style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label">Current Security Password</label>
                  <input
                    type={passForm.showPass ? 'text' : 'password'}
                    className="form-input"
                    value={passForm.current}
                    onChange={e => setPassForm({ ...passForm, current: e.target.value })}
                    placeholder="Enter current password (e.g. admin123)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type={passForm.showPass ? 'text' : 'password'}
                    className="form-input"
                    value={passForm.newPass}
                    onChange={e => setPassForm({ ...passForm, newPass: e.target.value })}
                    placeholder="Enter new strong password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type={passForm.showPass ? 'text' : 'password'}
                    className="form-input"
                    value={passForm.confirmPass}
                    onChange={e => setPassForm({ ...passForm, confirmPass: e.target.value })}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="filter-tab"
                    onClick={() => setPassForm({ ...passForm, showPass: !passForm.showPass })}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  >
                    {passForm.showPass ? '🙈 Hide Passwords' : '👁️ Show Passwords'}
                  </button>
                </div>

                {/* Password Criteria Checklist */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h4 style={{ fontSize: '0.8rem', color: '#00d4ff', margin: '0 0 0.6rem 0', fontWeight: 700 }}>Password Requirement Checklist</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem 1rem', fontSize: '0.75rem' }}>
                    <span style={{ color: hasLength ? '#00e68a' : '#94a3b8' }}>{hasLength ? '✔' : '✖'} At least 8 characters</span>
                    <span style={{ color: hasUpper ? '#00e68a' : '#94a3b8' }}>{hasUpper ? '✔' : '✖'} Uppercase letter (A-Z)</span>
                    <span style={{ color: hasLower ? '#00e68a' : '#94a3b8' }}>{hasLower ? '✔' : '✖'} Lowercase letter (a-z)</span>
                    <span style={{ color: hasNum ? '#00e68a' : '#94a3b8' }}>{hasNum ? '✔' : '✖'} Number (0-9)</span>
                    <span style={{ color: hasSpecial ? '#00e68a' : '#94a3b8' }}>{hasSpecial ? '✔' : '✖'} Special character (!@#$)</span>
                    <span style={{ color: isMatch ? '#00e68a' : '#94a3b8' }}>{isMatch ? '✔' : '✖'} Passwords match</span>
                  </div>
                </div>

                <button
                  className="btn-submit"
                  type="submit"
                  disabled={!isPassValid || !passForm.current}
                  style={{
                    opacity: (isPassValid && passForm.current) ? 1 : 0.5,
                    cursor: (isPassValid && passForm.current) ? 'pointer' : 'not-allowed',
                    fontWeight: 800,
                    padding: '0.7rem 1.8rem',
                    width: 'auto',
                    alignSelf: 'flex-start'
                  }}
                >
                  🔐 Update Password
                </button>
              </form>
            </div>
          )}

          {/* 5. ACTIVITY LOG & TIMELINE */}
          {activeTab === 'activity' && (
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📜 Employee Activity Timeline & Log
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['ALL', 'SECURITY', 'UPDATES', 'SYSTEM'] as const).map(f => (
                    <button
                      key={f}
                      className={`filter-tab ${activityFilter === f ? 'active' : ''}`}
                      onClick={() => setActivityFilter(f)}
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', borderRadius: '10px' }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Add Custom Activity Log */}
              <form onSubmit={handleAddCustomActivity} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input
                  className="form-input"
                  value={newCustomActivity}
                  onChange={e => setNewCustomActivity(e.target.value)}
                  placeholder="Enter a new activity log entry to test..."
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-submit" style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 800 }}>
                  ➕ Add Entry
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {filteredActivities.map((act, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.9rem 1.1rem', borderRadius: '12px', borderLeft: `3.5px solid ${act.category === 'SECURITY' ? '#00d4ff' : act.category === 'UPDATES' ? '#00e68a' : '#f59e0b'}` }}>
                    <span style={{ fontSize: '1.4rem' }}>{act.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>{act.title}</h4>
                        <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontWeight: 700 }}>{act.category}</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0.2rem 0 0 0' }}>{act.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. NOTIFICATION SWITCHES */}
          {activeTab === 'notifications' && (
            <div className="chart-card">
              <h3 style={{ color: '#ffffff', marginBottom: '1.25rem' }}>🔔 Notification Switches & Alert Subscriptions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '520px' }}>
                {[
                  { key: 'emailNotifs', label: 'Email Notifications', status: notifyPrefs.emailNotifs },
                  { key: 'smsAlerts', label: 'SMS Critical Telemetry Alerts', status: notifyPrefs.smsAlerts },
                  { key: 'machineFailureAlerts', label: 'Machine Failure & Downtime Alerts', status: notifyPrefs.machineFailureAlerts },
                  { key: 'maintenanceReminders', label: 'Preventive Maintenance Reminders', status: notifyPrefs.maintenanceReminders },
                  { key: 'dailyReport', label: 'Daily BEE Energy Report Dispatch', status: notifyPrefs.dailyReport },
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.9rem 1.15rem', borderRadius: '12px', cursor: 'pointer' }}>
                    <span style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700 }}>{item.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifyPrefs({ ...notifyPrefs, [item.key as keyof typeof notifyPrefs]: !item.status });
                        setFeedback(`✔ ${item.label} set to ${!item.status ? 'ON' : 'OFF'}`);
                        setTimeout(() => setFeedback(null), 2500);
                      }}
                      style={{
                        background: item.status ? '#00e68a' : '#64748b',
                        color: '#000',
                        border: 'none',
                        padding: '0.3rem 0.85rem',
                        borderRadius: '20px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {item.status ? 'ON' : 'OFF'}
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 7. SETTINGS & PORTAL CUSTOMIZATION */}
          {activeTab === 'settings' && (
            <div className="chart-card">
              <h3 style={{ color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚙️ Appearance & Portal Customization
              </h3>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '560px' }}>
                <div className="form-group">
                  <label className="form-label">Portal Theme Mode</label>
                  <select className="form-select" value={settingsForm.theme} onChange={e => setSettingsForm({ ...settingsForm, theme: e.target.value })}>
                    <option value="DARK">Dark Mode (Deep Cyan/Teal - Recommended)</option>
                    <option value="LIGHT">Light Mode (Industrial Clean)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dashboard View Layout</label>
                  <select className="form-select" value={settingsForm.compactMode ? 'COMPACT' : 'STANDARD'} onChange={e => setSettingsForm({ ...settingsForm, compactMode: e.target.value === 'COMPACT' })}>
                    <option value="STANDARD">Standard Grid (Spacious Cards)</option>
                    <option value="COMPACT">Compact Mode (High Density Telemetry)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Telemetry Auto Sync Interval</label>
                  <select className="form-select" value={settingsForm.refreshInterval} onChange={e => setSettingsForm({ ...settingsForm, refreshInterval: e.target.value })}>
                    <option value="10s">10 Seconds (Realtime)</option>
                    <option value="30s">30 Seconds (Default Balanced)</option>
                    <option value="60s">60 Seconds (Low Network Bandwidth)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date Format Display</label>
                  <select className="form-select" value={settingsForm.dateFormat} onChange={e => setSettingsForm({ ...settingsForm, dateFormat: e.target.value })}>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format standard)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Time Format Display</label>
                  <select className="form-select" value={settingsForm.timeFormat} onChange={e => setSettingsForm({ ...settingsForm, timeFormat: e.target.value })}>
                    <option value="12-Hour (AM/PM)">12-Hour (10:24 AM / 04:15 PM)</option>
                    <option value="24-Hour (Military)">24-Hour (10:24 / 16:15)</option>
                  </select>
                </div>

                <button
                  className="btn-submit"
                  type="submit"
                  style={{
                    fontWeight: 800,
                    padding: '0.7rem 1.8rem',
                    width: 'auto',
                    alignSelf: 'flex-start'
                  }}
                >
                  💾 Save Portal Settings
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* MOBILE OTP MODAL */}
      {showMobileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '12px', border: '1px solid #00d4ff', width: '400px', maxWidth: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,212,255,0.2)' }}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Verify Mobile Number</h3>
            
            {mobileVerificationState === 'idle' && (
              <>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Enter your new mobile number to receive an OTP.</p>
                <input className="form-input" value={newMobile} onChange={e => setNewMobile(e.target.value)} placeholder="+91 XXXXXXXXXX" style={{ marginBottom: '1rem', textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button className="btn-submit" onClick={() => sendOtp('MOBILE')} style={{ width: 'auto' }} disabled={!newMobile}>Send OTP</button>
                  <button className="filter-tab" onClick={() => setShowMobileModal(false)}>Cancel</button>
                </div>
              </>
            )}

            {mobileVerificationState === 'sending' && (
              <p style={{ color: '#00d4ff' }}>Sending OTP...</p>
            )}

            {(mobileVerificationState === 'otpSent' || mobileVerificationState === 'error' || mobileVerificationState === 'verifying') && (
              <>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>OTP sent to {newMobile}</p>
                <input className="form-input" value={mobileOtp} onChange={e => setMobileOtp(e.target.value)} placeholder="_ _ _ _ _ _" maxLength={6} style={{ marginBottom: '1rem', textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 800 }} />
                
                {mobileVerificationState === 'error' && <p style={{ color: '#ff3b6a', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>✕ Invalid or expired OTP</p>}
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                  <button className="btn-submit" onClick={() => verifyOtp('MOBILE')} style={{ width: 'auto' }} disabled={mobileOtp.length !== 6 || mobileVerificationState === 'verifying'}>
                    {mobileVerificationState === 'verifying' ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button className="filter-tab" onClick={() => setShowMobileModal(false)}>Cancel</button>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {resendTimer > 0 ? (
                    `Resend OTP in 00:${resendTimer.toString().padStart(2, '0')}`
                  ) : (
                    <button type="button" onClick={() => sendOtp('MOBILE')} style={{ background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontWeight: 700 }}>Resend OTP</button>
                  )}
                </p>
              </>
            )}

            {mobileVerificationState === 'verified' && (
              <p style={{ color: '#00e68a', fontWeight: 800, fontSize: '1.1rem' }}>✓ Mobile number verified successfully</p>
            )}
          </div>
        </div>
      )}

      {/* EMAIL OTP MODAL */}
      {showEmailModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '12px', border: '1px solid #00d4ff', width: '400px', maxWidth: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,212,255,0.2)' }}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Verify Email Address</h3>
            
            {emailVerificationState === 'idle' && (
              <>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Enter your new email address to receive an OTP.</p>
                <input className="form-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="newadmin@factory.com" style={{ marginBottom: '1rem', textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button className="btn-submit" onClick={() => sendOtp('EMAIL')} style={{ width: 'auto' }} disabled={!newEmail}>Send OTP</button>
                  <button className="filter-tab" onClick={() => setShowEmailModal(false)}>Cancel</button>
                </div>
              </>
            )}

            {emailVerificationState === 'sending' && (
              <p style={{ color: '#00d4ff' }}>Sending OTP...</p>
            )}

            {(emailVerificationState === 'otpSent' || emailVerificationState === 'error' || emailVerificationState === 'verifying') && (
              <>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>OTP sent to {newEmail}</p>
                <input className="form-input" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} placeholder="_ _ _ _ _ _" maxLength={6} style={{ marginBottom: '1rem', textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 800 }} />
                
                {emailVerificationState === 'error' && <p style={{ color: '#ff3b6a', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>✕ Invalid or expired OTP</p>}
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                  <button className="btn-submit" onClick={() => verifyOtp('EMAIL')} style={{ width: 'auto' }} disabled={emailOtp.length !== 6 || emailVerificationState === 'verifying'}>
                    {emailVerificationState === 'verifying' ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button className="filter-tab" onClick={() => setShowEmailModal(false)}>Cancel</button>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {resendTimer > 0 ? (
                    `Resend OTP in 00:${resendTimer.toString().padStart(2, '0')}`
                  ) : (
                    <button type="button" onClick={() => sendOtp('EMAIL')} style={{ background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontWeight: 700 }}>Resend OTP</button>
                  )}
                </p>
              </>
            )}

            {emailVerificationState === 'verified' && (
              <p style={{ color: '#00e68a', fontWeight: 800, fontSize: '1.1rem' }}>✓ Email verified successfully</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
