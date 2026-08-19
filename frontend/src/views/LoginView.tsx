import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/api';
import type { UserRole } from '../types/machine';

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const ROLE_PRESETS = [
  { label: '👑 Admin',        email: 'admin@factory.com',    pass: 'admin123',    role: 'ADMIN' as UserRole },
  { label: '🏭 Manager',      email: 'manager@factory.com',  pass: 'manager123',  role: 'FACTORY_MANAGER' as UserRole },
  { label: '🔧 Engineer',     email: 'engineer@factory.com', pass: 'engineer123', role: 'MAINTENANCE_ENGINEER' as UserRole },
  { label: '⚙️ Operator',    email: 'operator@factory.com', pass: 'operator123', role: 'MACHINE_OPERATOR' as UserRole },
  { label: '🔬 Inspector',    email: 'quality@factory.com',  pass: 'quality123',  role: 'QUALITY_INSPECTOR' as UserRole },
];

const FEATURES = [
  { icon: '📡', title: 'Real-time IoT Telemetry',   desc: 'Live sensor data from 200+ connected machines across all units.' },
  { icon: '🤖', title: 'AI-Powered Predictive Alerts', desc: 'ML models detect anomalies and predict failures before they happen.' },
  { icon: '⚡', title: 'Instant Incident Response',  desc: 'Automated alerts route issues to the right team within seconds.' },
  { icon: '🌱', title: 'Sustainability Dashboard',   desc: 'Track energy, carbon footprint and ESG metrics in one view.' },
];

// ─── Password strength helper ─────────────────────────────────────────────────

function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { level: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Weak' };
  if (score === 2) return { level: 2, label: 'Medium' };
  return { level: 3, label: 'Strong' };
}

// ─── OTP Input Group ──────────────────────────────────────────────────────────

const OtpInputs: React.FC<{
  value: string[];
  onChange: (v: string[]) => void;
}> = ({ value, onChange }) => {
  const handleChange = (i: number, v: string) => {
    if (v.length > 1) v = v.charAt(v.length - 1);
    const next = [...value];
    next[i] = v;
    onChange(next);
    if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };
  return (
    <div className="auth-otp-grid">
      {value.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          className={`auth-otp-input${digit ? ' filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
};

// ─── Left branding panel ──────────────────────────────────────────────────────

const AuthLeft: React.FC = () => (
  <div className="auth-left">
    <div className="auth-left-orb auth-left-orb-1" />
    <div className="auth-left-orb auth-left-orb-2" />
    <div className="auth-left-orb auth-left-orb-3" />

    <div className="auth-left-brand">
      <div className="auth-left-brand-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" width="56" height="56">
          <defs>
            <linearGradient id="lgAuth" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0b0f19"/>
              <stop offset="100%" stopColor="#131a2e"/>
            </linearGradient>
            <linearGradient id="pulseAuth" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981"/>
              <stop offset="100%" stopColor="#06b6d4"/>
            </linearGradient>
            <filter id="glowAuth">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#lgAuth)" stroke="rgba(16,185,129,0.45)" strokeWidth="1.8"/>
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(6,182,212,0.25)" strokeWidth="1.2"/>
          <polyline
            filter="url(#glowAuth)"
            points="8,32 16,32 20,20 24,44 28,26 32,38 36,32 44,32 48,26 52,32 56,32"
            stroke="url(#pulseAuth)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="32" cy="32" r="3" fill="#10b981" filter="url(#glowAuth)" opacity="0.9"/>
        </svg>
        <div>
          <h1>SmartFactory 360</h1>
          <p>Industry 4.0 · IoT &amp; ML Analytics</p>
        </div>
      </div>
    </div>

    <div className="auth-left-tagline">
      <h2>
        The Future of<br />
        <span>Factory Intelligence</span>
      </h2>
      <p>
        Monitor 200+ machines in real-time, predict failures before they happen, and drive operational excellence from a single platform.
      </p>
    </div>

    <div className="auth-features">
      {FEATURES.map(f => (
        <div className="auth-feature-item" key={f.title}>
          <div className="auth-feature-icon">{f.icon}</div>
          <div className="auth-feature-text">
            <strong>{f.title}</strong>
            <span>{f.desc}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="auth-status-bar">
      <div className="auth-status-dot" />
      All systems operational · SmartFactory 360 Enterprise v4.2
    </div>
  </div>
);

// ─── Sign In Panel ────────────────────────────────────────────────────────────

const SignInPanel: React.FC<{ onForgot: () => void; onRegister: () => void }> = ({ onForgot, onRegister }) => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await authApi.login(email, password);
      dispatch({
        type: 'SET_USER_SESSION',
        payload: {
          token: res.token,
          user: {
            id: res.id, employeeId: res.employeeId, fullName: res.fullName,
            email: res.email, role: res.role, department: res.department,
            designation: res.designation, shift: res.shift, factoryLocation: res.factoryLocation,
          },
        },
      });
      switch (res.role) {
        case 'MAINTENANCE_ENGINEER': navigate('/machines'); break;
        case 'MACHINE_OPERATOR':     navigate('/machines/1'); break;
        default:                     navigate('/');
      }
    } catch {
      // ── Offline / demo fallback ──────────────────────────────────────────
      // Backend is unreachable. Try matching against built-in preset credentials.
      const preset = ROLE_PRESETS.find(p => p.email === email && p.pass === password);
      if (preset) {
        dispatch({
          type: 'SET_USER_SESSION',
          payload: {
            token: `JWT_DEMO_${preset.role}`,
            user: {
              id: Math.floor(1000 + Math.random() * 9000),
              employeeId: `EMP-DEMO`,
              fullName: preset.label.replace(/^[^\s]+\s/, ''), // strip emoji
              email: preset.email,
              role: preset.role,
              department: 'Demo Department',
              designation: preset.label,
              shift: 'MORNING',
              factoryLocation: 'Plant A',
            },
          },
        });
        switch (preset.role) {
          case 'MAINTENANCE_ENGINEER': navigate('/machines'); break;
          case 'MACHINE_OPERATOR':     navigate('/machines/1'); break;
          default:                     navigate('/');
        }
      } else {
        setError('Login failed. Check your credentials or use a demo preset above.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-panel" key="signin">
      <div className="auth-card-header">
        <h2>🔐 Welcome Back</h2>
        <p>Sign in to your SmartFactory dashboard</p>
      </div>

      {/* Quick Role Presets */}
      <div className="auth-role-presets">
        <span className="auth-role-presets-label">⚡ Quick demo access — select a role:</span>
        <div className="auth-role-presets-grid">
          {ROLE_PRESETS.map(p => (
            <button
              key={p.role}
              type="button"
              className={`auth-role-chip${email === p.email ? ' active' : ''}`}
              onClick={() => selectPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="auth-error">⚠️ {error}</div>}

      <form className="auth-form" onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Employee Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="e.g. admin@factory.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Security Password
          </label>
          <div className="auth-pw-wrap">
            <input
              className="form-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Enter your passkey"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-pw-toggle"
              onClick={() => setShowPw(v => !v)}
            >
              {showPw ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
        </div>

        <div className="auth-options-row">
          <label className="auth-remember">
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
            Remember me
          </label>
          <button type="button" className="auth-forgot" onClick={onForgot}>
            Forgot Password?
          </button>
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? '🔐 Authenticating…' : '🚀 Sign In to Dashboard'}
        </button>
      </form>

      <div className="auth-footer">
        New to SmartFactory?{' '}
        <button className="auth-footer-link" onClick={onRegister}>
          Create an Account
        </button>
      </div>

      <div className="auth-security-footer">
        🔒 Protected by Spring Security &amp; JWT · TLS 1.3
      </div>
    </div>
  );
};

// ─── Register Panel ───────────────────────────────────────────────────────────

type RegStep = 'DETAILS' | 'OTP';

const RegisterPanel: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [step, setStep] = useState<RegStep>('DETAILS');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<UserRole>('MACHINE_OPERATOR');
  const [department, setDepartment] = useState('Production');
  const [designation, setDesignation] = useState('Operator');
  const [shift, setShift] = useState('Morning Shift (06:00 - 14:00)');
  const [factoryLocation, setFactoryLocation] = useState('SmartFactory Unit 1 · Chennai');

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [maskedPhone, setMaskedPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwStrength = getPasswordStrength(password);

  useEffect(() => {
    if (step !== 'OTP') return;
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [step, otpTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || phone.trim() === '+91' || !password || !employeeId) {
      setError('Please fill in all mandatory fields.'); return;
    }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMaskedPhone(data.phone || phone);
        // ✅ Only advance to OTP step on success
        setStep('OTP');
        setOtpTimer(60);
        setOtp(['', '', '', '', '', '']);
      } else {
        // Backend rejected (e.g. 30-second cooldown, invalid phone)
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch {
      // Backend offline — generate a local dev OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      (window as any).__devOtp = code;
      setMaskedPhone(phone);
      console.log(`[DEV] OTP: ${code}`);
      // Still advance to OTP step in offline/dev mode
      setStep('OTP');
      setOtpTimer(60);
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
    } catch {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      (window as any).__devOtp = code;
      console.log(`[DEV] Resent OTP: ${code}`);
    } finally {
      setLoading(false);
      setOtpTimer(60);
      setOtp(['', '', '', '', '', '']);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit OTP.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await completeRegistration();
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch {
      const devOtp = (window as any).__devOtp;
      if (code === devOtp || code === '123456') {
        await completeRegistration();
      } else {
        setError('[Dev fallback] Invalid OTP. Use 123456 when backend is offline.');
      }
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    try {
      const res = await authApi.register({ fullName, email, phone, password, role, department, designation });
      const user = {
        id: res.userId || Date.now(),
        employeeId: employeeId || res.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName, email, phone, role, department, designation, shift, factoryLocation,
      };
      dispatch({ type: 'SET_USER_SESSION', payload: { token: res.token || `JWT_MOCK_${role}`, user } });
      dispatch({
        type: 'ADD_WORKER',
        payload: {
          id: user.id, name: fullName,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
          role: designation, shift: 'MORNING', attendance: 'PRESENT',
          safetyTraining: true, performanceScore: 100,
        },
      });
      // Mark that this device has successfully registered at least once.
      // This ensures returning users always land on the Sign In tab.
      localStorage.setItem('fac_mon_has_registered', 'true');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  if (step === 'OTP') {
    return (
      <div className="auth-panel" key="reg-otp">
        <div className="auth-steps">
          <div className="auth-step-dot done" />
          <div className="auth-step-dot active" />
        </div>

        <button className="auth-back-btn" onClick={() => setStep('DETAILS')}>← Back to Details</button>

        <div className="auth-sms-notice">
          <div className="auth-sms-icon">📱</div>
          <div className="auth-sms-text">
            <strong>OTP Sent via SMS</strong>
            <span>6-digit code sent to <strong style={{ color: '#fff' }}>{maskedPhone}</strong></span>
          </div>
          <div className="auth-sms-badge">✓ SMS Sent</div>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={handleVerify}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🔐</div>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem', marginBottom: '0.1rem' }}>
              Enter Verification Code
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Enter the 6-digit code to complete registration
            </p>
          </div>

          <OtpInputs value={otp} onChange={setOtp} />

          <div className="auth-dev-hint">
            🧪 <strong>Dev Mode:</strong> Check backend console for OTP. Offline fallback: use <strong>123456</strong>. Real SMS via Twilio when <code>twilio.enabled=true</code>.
          </div>

          <div className="auth-resend-row">
            <span>⏱️ Resend in: <strong style={{ color: '#00d4ff' }}>{otpTimer}s</strong></span>
            <button
              type="button"
              className="auth-resend-btn"
              disabled={otpTimer > 0 || loading}
              onClick={handleResend}
            >
              {loading ? '⏳ Sending…' : '🔄 Resend OTP'}
            </button>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '⏳ Verifying…' : '✅ Verify & Create Account'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-panel" key="reg-details">
      <div className="auth-steps">
        <div className="auth-step-dot active" />
        <div className="auth-step-dot" />
      </div>

      <div className="auth-card-header">
        <h2>👷 Create Account</h2>
        <p>Step 1 of 2 · Worker account setup</p>
      </div>

      {error && <div className="auth-error">⚠️ {error}</div>}

      <form className="auth-form" onSubmit={handleSendOtp}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" placeholder="e.g. Ramesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>

        <div className="auth-form-row">
          <div className="form-group">
            <label className="form-label">Official Email *</label>
            <input className="form-input" type="email" placeholder="e.g. ramesh@factory.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone (OTP) *</label>
            <input className="form-input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
        </div>

        <div className="auth-form-row">
          <div className="form-group">
            <label className="form-label">Employee ID *</label>
            <input className="form-input" placeholder="e.g. EMP-1010" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Factory Location *</label>
            <select className="form-select" value={factoryLocation} onChange={e => setFactoryLocation(e.target.value)}>
              <option value="SmartFactory Unit 1 · Chennai">Unit 1 · Chennai</option>
              <option value="SmartFactory Unit 2 · Pune">Unit 2 · Pune</option>
              <option value="SmartFactory Unit 3 · Bangalore">Unit 3 · Bangalore</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Security Password *</label>
          <div className="auth-pw-wrap">
            <input
              className="form-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Create a strong passkey"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {password && (
            <div className="auth-pw-strength">
              {[1, 2, 3].map(n => (
                <div key={n} className={`auth-pw-strength-bar${
                  pwStrength.level >= n
                    ? ` filled-${pwStrength.level === 1 ? 'weak' : pwStrength.level === 2 ? 'medium' : 'strong'}`
                    : ''
                }`} />
              ))}
              <span className={`auth-pw-strength-label ${pwStrength.level === 1 ? 'weak' : pwStrength.level === 2 ? 'medium' : 'strong'}`}>
                {pwStrength.label}
              </span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password *</label>
          <input
            className="form-input"
            type="password"
            placeholder="Re-enter passkey"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            required
            style={{ borderColor: confirmPw && confirmPw !== password ? 'rgba(255,59,106,0.5)' : '' }}
          />
          {confirmPw && confirmPw !== password && (
            <span style={{ fontSize: '0.7rem', color: '#ff3b6a', marginTop: '0.2rem', display: 'block' }}>Passwords do not match</span>
          )}
        </div>

        <div className="auth-form-row">
          <div className="form-group">
            <label className="form-label">Factory Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="MACHINE_OPERATOR">Machine Operator</option>
              <option value="MAINTENANCE_ENGINEER">Maintenance Engineer</option>
              <option value="QUALITY_INSPECTOR">Quality Inspector</option>
              <option value="FACTORY_MANAGER">Factory Manager</option>
              <option value="ADMIN">Factory Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department *</label>
            <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)}>
              <option>Production</option>
              <option>Maintenance</option>
              <option>Engineering</option>
              <option>Quality Control</option>
              <option>Safety</option>
              <option>Sustainability</option>
              <option>Administration</option>
              <option>Human Resources</option>
              <option>IT</option>
              <option>Operations</option>
            </select>
          </div>
        </div>

        <div className="auth-form-row">
          <div className="form-group">
            <label className="form-label">Designation *</label>
            <select className="form-select" value={designation} onChange={e => setDesignation(e.target.value)}>
              <option value="Operator">Operator</option>
              <option value="Technician">Technician</option>
              <option value="Engineer">Engineer</option>
              <option value="Shift Supervisor">Shift Supervisor</option>
              <option value="Plant Manager">Plant Manager</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Factory Administrator">Factory Administrator</option>
              <option value="HR Manager">HR Manager</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Shift</label>
            <select className="form-select" value={shift} onChange={e => setShift(e.target.value)}>
              <option value="Morning Shift (06:00 - 14:00)">Morning Shift</option>
              <option value="Evening Shift (14:00 - 22:00)">Evening Shift</option>
              <option value="Night Shift (22:00 - 06:00)">Night Shift</option>
            </select>
          </div>
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? '⏳ Sending OTP…' : '📱 Proceed to OTP Verification →'}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <button className="auth-footer-link" onClick={onSignIn}>Sign In</button>
      </div>
    </div>
  );
};

// ─── Forgot Password Panel ────────────────────────────────────────────────────

type ForgotStep = 'EMAIL' | 'OTP' | 'NEWPW' | 'DONE';

const ForgotPasswordPanel: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  const [step, setStep] = useState<ForgotStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwStrength = getPasswordStrength(newPw);

  useEffect(() => {
    if (step !== 'OTP') return;
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [step, otpTimer]);

  const stepIndex = { EMAIL: 0, OTP: 1, NEWPW: 2, DONE: 3 }[step];

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your registered email.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to send OTP.'); return; }
    } catch {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      (window as any).__devForgotOtp = code;
      console.log(`[DEV] Forgot PW OTP: ${code}`);
    } finally {
      setLoading(false);
    }
    setStep('OTP');
    setOtpTimer(60);
    setOtp(['', '', '', '', '', '']);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('NEWPW');
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch {
      const devOtp = (window as any).__devForgotOtp;
      if (code === devOtp || code === '123456') {
        setStep('NEWPW');
      } else {
        setError('[Dev fallback] Use 123456 when backend is offline.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp.join(''), newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('DONE');
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch {
      // Dev fallback — simulate success
      setStep('DONE');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'DONE') {
    return (
      <div className="auth-panel" key="forgot-done">
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#00e68a', fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 900 }}>Password Reset!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Your password has been successfully reset.<br />
            You can now sign in with your new credentials.
          </p>
          <button className="auth-submit" onClick={onSignIn}>
            🚀 Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-panel" key={`forgot-${step}`}>
      <div className="auth-steps">
        {[0, 1, 2].map(i => (
          <div key={i} className={`auth-step-dot${i === stepIndex ? ' active' : i < stepIndex ? ' done' : ''}`} />
        ))}
      </div>

      {step !== 'EMAIL' && (
        <button className="auth-back-btn" onClick={() => { setStep(step === 'OTP' ? 'EMAIL' : 'OTP'); setError(null); }}>
          ← Back
        </button>
      )}

      {step === 'EMAIL' && (
        <>
          <div className="auth-card-header">
            <h2>🔑 Reset Password</h2>
            <p>Step 1 of 3 · Enter your registered email</p>
          </div>
          {error && <div className="auth-error">⚠️ {error}</div>}
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="e.g. admin@factory.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              We'll send a 6-digit verification code to your registered phone number linked to this email.
            </p>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? '⏳ Sending OTP…' : '📱 Send Verification Code →'}
            </button>
          </form>
        </>
      )}

      {step === 'OTP' && (
        <>
          <div className="auth-card-header">
            <h2>📱 Verify Identity</h2>
            <p>Step 2 of 3 · Enter the OTP sent to your phone</p>
          </div>
          <div className="auth-sms-notice">
            <div className="auth-sms-icon">📱</div>
            <div className="auth-sms-text">
              <strong>OTP Sent</strong>
              <span>Code sent to the phone linked to <strong style={{ color: '#fff' }}>{email}</strong></span>
            </div>
            <div className="auth-sms-badge">✓ SMS Sent</div>
          </div>
          {error && <div className="auth-error">⚠️ {error}</div>}
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <OtpInputs value={otp} onChange={setOtp} />
            <div className="auth-dev-hint">
              🧪 <strong>Dev Mode:</strong> Use <strong>123456</strong> when backend is offline.
            </div>
            <div className="auth-resend-row">
              <span>⏱️ Resend in: <strong style={{ color: '#00d4ff' }}>{otpTimer}s</strong></span>
              <button
                type="button"
                className="auth-resend-btn"
                disabled={otpTimer > 0 || loading}
                onClick={() => { setOtpTimer(60); setOtp(['', '', '', '', '', '']); }}
              >
                🔄 Resend OTP
              </button>
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? '⏳ Verifying…' : '✅ Verify Code →'}
            </button>
          </form>
        </>
      )}

      {step === 'NEWPW' && (
        <>
          <div className="auth-card-header">
            <h2>🛡️ New Password</h2>
            <p>Step 3 of 3 · Set your new factory passkey</p>
          </div>
          {error && <div className="auth-error">⚠️ {error}</div>}
          <form className="auth-form" onSubmit={handleResetPw}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="auth-pw-wrap">
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a strong passkey"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  required
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {newPw && (
                <div className="auth-pw-strength">
                  {[1, 2, 3].map(n => (
                    <div key={n} className={`auth-pw-strength-bar${
                      pwStrength.level >= n
                        ? ` filled-${pwStrength.level === 1 ? 'weak' : pwStrength.level === 2 ? 'medium' : 'strong'}`
                        : ''
                    }`} />
                  ))}
                  <span className={`auth-pw-strength-label ${pwStrength.level === 1 ? 'weak' : pwStrength.level === 2 ? 'medium' : 'strong'}`}>
                    {pwStrength.label}
                  </span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Re-enter new passkey"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                style={{ borderColor: confirmPw && confirmPw !== newPw ? 'rgba(255,59,106,0.5)' : '' }}
              />
              {confirmPw && confirmPw !== newPw && (
                <span style={{ fontSize: '0.7rem', color: '#ff3b6a', marginTop: '0.2rem', display: 'block' }}>Passwords do not match</span>
              )}
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? '⏳ Resetting…' : '🔐 Reset & Secure Account'}
            </button>
          </form>
        </>
      )}

      {step === 'EMAIL' && (
        <div className="auth-footer">
          Remembered it?{' '}
          <button className="auth-footer-link" onClick={onSignIn}>Back to Sign In</button>
        </div>
      )}
    </div>
  );
};

// ─── Main LoginView ───────────────────────────────────────────────────────────

type AuthTab = 'signin' | 'register' | 'forgot';

/**
 * Determine the initial tab to show:
 * - New visitor (no account ever created on this device) → 'register'
 * - Returning user (has a saved session OR has registered before) → 'signin'
 */
function getInitialTab(): AuthTab {
  const hasSession    = !!localStorage.getItem('fac_mon_current_user');
  const hasRegistered = !!localStorage.getItem('fac_mon_has_registered');
  return hasSession || hasRegistered ? 'signin' : 'register';
}

const LoginView: React.FC = () => {
  const [tab, setTab] = useState<AuthTab>(getInitialTab);

  // Reset to top of card on tab switch
  const cardRef = useRef<HTMLDivElement>(null);
  const switchTab = (t: AuthTab) => {
    setTab(t);
    cardRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="auth-root">
      <AuthLeft />

      <div className="auth-right">
        <div className="auth-card" ref={cardRef}>
          {/* Tab bar */}
          <div className="auth-tab-bar" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'signin'}
              className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
              onClick={() => switchTab('signin')}
            >
              🔐 Sign In
            </button>
            <button
              role="tab"
              aria-selected={tab === 'register'}
              className={`auth-tab${tab === 'register' ? ' active' : ''}`}
              onClick={() => switchTab('register')}
            >
              👷 Register
            </button>
            <button
              role="tab"
              aria-selected={tab === 'forgot'}
              className={`auth-tab${tab === 'forgot' ? ' active' : ''}`}
              onClick={() => switchTab('forgot')}
            >
              🔑 Reset Pwd
            </button>
          </div>

          {/* Active panel */}
          {tab === 'signin' && (
            <SignInPanel
              onForgot={() => switchTab('forgot')}
              onRegister={() => switchTab('register')}
            />
          )}
          {tab === 'register' && (
            <RegisterPanel onSignIn={() => switchTab('signin')} />
          )}
          {tab === 'forgot' && (
            <ForgotPasswordPanel onSignIn={() => switchTab('signin')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
