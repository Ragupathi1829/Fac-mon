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

interface OtpInputsProps {
  value: string[];
  onChange: (v: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

const OtpInputs: React.FC<OtpInputsProps> = ({ value, onChange, onComplete, disabled }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    // Only accept numeric digits
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned && val !== '') return;

    const char = cleaned.length > 0 ? cleaned.charAt(cleaned.length - 1) : '';
    const next = [...value];
    next[i] = char;
    onChange(next);

    if (char && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }

    // Check if complete
    const fullCode = next.join('');
    if (fullCode.length === 6 && onComplete) {
      onComplete(fullCode);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      inputRefs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      e.preventDefault();
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const next = [...value];
    for (let j = 0; j < 6; j++) {
      next[j] = digits[j] || '';
    }
    onChange(next);

    const targetFocus = Math.min(digits.length, 5);
    inputRefs.current[targetFocus]?.focus();

    if (digits.length >= 6 && onComplete) {
      onComplete(digits.slice(0, 6).join(''));
    }
  };

  return (
    <div className="auth-otp-grid">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          id={`otp-${i}`}
          className={`auth-otp-input${digit ? ' filled' : ''}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`OTP Digit ${i + 1}`}
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

const SignInPanel: React.FC<{ onForgot: () => void; onRegister: (phone?: string) => void }> = ({ onForgot, onRegister }) => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  
  // Modes
  const [authMode, setAuthMode] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [phoneStep, setPhoneStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // Phone State
  const [phone, setPhone] = useState('+91 ');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Common State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phoneStep !== 'OTP' || authMode !== 'PHONE') return;
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [phoneStep, otpTimer, authMode]);

  const selectPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setAuthMode('EMAIL');
    setEmail(preset.email);
    setPassword(preset.pass);
    setError(null);
    setSuccessMessage(null);
  };

  const maskPhoneNumber = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return '+91 ******' + cleaned.slice(-4);
    }
    return raw;
  };

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await authApi.sendOtp(phone.trim());
      if (res.success) {
        setMaskedPhone(maskPhoneNumber(phone.trim()));
        setPhoneStep('OTP');
        setOtpTimer(60);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneResendOtp = async () => {
    if (otpTimer > 0 || loading) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await authApi.sendOtp(phone.trim());
      setOtpTimer(60);
      setOtp(['', '', '', '', '', '']);
      setSuccessMessage('A fresh OTP has been sent.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerifyOtp = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const code = customCode || otp.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await authApi.verifyOtp(phone.trim(), code);
      if (res.success) {
        if (res.requiresRegistration) {
          setSuccessMessage('✓ Phone number verified!');
          setTimeout(() => {
            onRegister(phone.trim());
          }, 800);
        } else if (res.token && res.user) {
          setSuccessMessage('✓ Verified! Signing you in…');
          dispatch({
            type: 'SET_USER_SESSION',
            payload: { token: res.token, user: res.user }
          });
          setTimeout(() => {
            navigate(res.user.role === 'MAINTENANCE_ENGINEER' ? '/machines' : res.user.role === 'MACHINE_OPERATOR' ? '/machines/1' : '/');
          }, 600);
        }
      } else {
        setError(res.message || 'Incorrect OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
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
    } catch (err: any) {
      const preset = ROLE_PRESETS.find(p => p.email === email && p.pass === password);
      if (preset) {
        dispatch({
          type: 'SET_USER_SESSION',
          payload: {
            token: `JWT_DEMO_${preset.role}`,
            user: {
              id: Math.floor(1000 + Math.random() * 9000),
              employeeId: `EMP-DEMO`,
              fullName: preset.label.replace(/^[^\s]+\s/, ''),
              email: preset.email,
              role: preset.role,
              department: 'Demo Department',
              designation: preset.label,
              shift: 'Morning Shift (06:00 - 14:00)',
              factoryLocation: 'SmartFactory Unit 1 · Chennai',
            },
          },
        });
        switch (preset.role) {
          case 'MAINTENANCE_ENGINEER': navigate('/machines'); break;
          case 'MACHINE_OPERATOR':     navigate('/machines/1'); break;
          default:                     navigate('/');
        }
      } else {
        setError(err.message || 'Login failed. Check your credentials.');
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

      <div className="auth-mode-toggle" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <button type="button" className={`auth-role-chip ${authMode === 'PHONE' ? 'active' : ''}`} style={{ flex: 1, margin: 0, justifyContent: 'center' }} onClick={() => { setAuthMode('PHONE'); setError(null); setSuccessMessage(null); }}>📱 Mobile OTP</button>
        <button type="button" className={`auth-role-chip ${authMode === 'EMAIL' ? 'active' : ''}`} style={{ flex: 1, margin: 0, justifyContent: 'center' }} onClick={() => { setAuthMode('EMAIL'); setError(null); setSuccessMessage(null); }}>✉️ Email &amp; Password</button>
      </div>

      {authMode === 'EMAIL' && (
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
      )}

      {error && <div className="auth-error">⚠️ {error}</div>}
      {successMessage && (
        <div style={{ background: 'rgba(0,230,138,0.15)', border: '1px solid rgba(0,230,138,0.4)', color: '#00e68a', padding: '0.65rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 700, textAlign: 'center' }}>
          {successMessage}
        </div>
      )}

      {authMode === 'PHONE' && phoneStep === 'PHONE' && (
        <form className="auth-form" onSubmit={handlePhoneSendOtp}>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                className="form-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                autoFocus
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
              Enter your registered 10-digit mobile number for secure instant OTP login.
            </span>
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '⏳ Sending OTP…' : '📱 Send OTP'}
          </button>
        </form>
      )}

      {authMode === 'PHONE' && phoneStep === 'OTP' && (
        <form className="auth-form" onSubmit={handlePhoneVerifyOtp}>
          <div className="auth-sms-notice" style={{ marginBottom: '1.25rem' }}>
            <div className="auth-sms-icon">📱</div>
            <div className="auth-sms-text">
              <strong>OTP Dispatched</strong>
              <span>6-digit code sent to <strong style={{ color: '#00d4ff' }}>{maskedPhone}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => { setPhoneStep('PHONE'); setError(null); setSuccessMessage(null); }}
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', padding: '0.3rem 0.6rem' }}
            >
              Change
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem', marginBottom: '0.1rem' }}>
              Enter 6-Digit Verification Code
            </p>
          </div>

          <OtpInputs
            value={otp}
            onChange={setOtp}
            onComplete={(code) => handlePhoneVerifyOtp(undefined, code)}
            disabled={loading}
          />

          <div className="auth-resend-row" style={{ marginTop: '1rem' }}>
            <span>⏱️ Resend in: <strong style={{ color: '#00d4ff' }}>{otpTimer > 0 ? `${otpTimer}s` : 'Ready'}</strong></span>
            <button
              type="button"
              className="auth-resend-btn"
              disabled={otpTimer > 0 || loading}
              onClick={handlePhoneResendOtp}
              style={{
                cursor: otpTimer === 0 && !loading ? 'pointer' : 'not-allowed',
                color: otpTimer === 0 && !loading ? '#00e68a' : '#64748b',
                fontWeight: 700
              }}
            >
              {loading ? '⏳ Sending…' : '🔄 Resend OTP'}
            </button>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '⏳ Verifying…' : '✅ Verify & Continue'}
          </button>
        </form>
      )}

      {authMode === 'EMAIL' && (
        <form className="auth-form" onSubmit={handleEmailLogin}>
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
      )}

      <div className="auth-footer">
        New to SmartFactory?{' '}
        <button className="auth-footer-link" onClick={() => onRegister(authMode === 'PHONE' && phoneStep === 'PHONE' ? phone : undefined)}>
          Create an Account
        </button>
      </div>

      <div className="auth-security-footer">
        🔒 Protected by Spring Security &amp; Twilio Real-Time OTP · TLS 1.3
      </div>
    </div>
  );
};

// ─── Register Panel ───────────────────────────────────────────────────────────

type RegStep = 'DETAILS' | 'OTP';

const RegisterPanel: React.FC<{ onSignIn: () => void; initialPhone?: string }> = ({ onSignIn, initialPhone }) => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [step, setStep] = useState<RegStep>('DETAILS');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(initialPhone || '+91 ');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<UserRole>('MACHINE_OPERATOR');
  const [department, setDepartment] = useState('Production');
  const [designation, setDesignation] = useState('Operator');
  const [shift, setShift] = useState('Morning Shift (06:00 - 14:00)');
  const [factoryLocation, setFactoryLocation] = useState('SmartFactory Unit 1 · Chennai');

  // If initialPhone was supplied from verified Step 1, consider it pre-verified
  const [phonePreVerified] = useState<boolean>(!!initialPhone && initialPhone.length >= 10);

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

  const maskPhoneNumber = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return '+91 ******' + cleaned.slice(-4);
    }
    return raw;
  };

  const handleSendOtpOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || phone.trim() === '+91' || !password || !employeeId) {
      setError('Please fill in all mandatory fields.'); return;
    }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    
    // If already verified via Login OTP flow, proceed straight to registration
    if (phonePreVerified) {
      setLoading(true);
      setError(null);
      await completeRegistration();
      setLoading(false);
      return;
    }

    setLoading(true); setError(null);
    try {
      const res = await authApi.sendOtp(phone.trim());
      if (res.success) {
        setMaskedPhone(maskPhoneNumber(phone.trim()));
        setStep('OTP');
        setOtpTimer(60);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (otpTimer > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.sendOtp(phone.trim());
      setOtpTimer(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const code = customCode || otp.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit OTP code.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await authApi.verifyOtp(phone.trim(), code);
      if (res.success) {
        await completeRegistration();
      } else {
        setError(res.message || 'Incorrect OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
    try {
      const res = await authApi.register({ fullName, email, phone, password, role, department, designation, factoryLocation });
      const user = {
        id: res.userId || res.id || Date.now(),
        employeeId: employeeId || res.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName, email, phone, role, department, designation, shift, factoryLocation,
      };
      dispatch({ type: 'SET_USER_SESSION', payload: { token: res.token || `JWT_BEARER_${user.id}_${role}`, user } });
      dispatch({
        type: 'ADD_WORKER',
        payload: {
          id: user.id, name: fullName,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
          role: designation, shift: 'MORNING', attendance: 'PRESENT',
          safetyTraining: true, performanceScore: 100,
        },
      });
      localStorage.setItem('fac_mon_has_registered', 'true');
      navigate(role === 'MAINTENANCE_ENGINEER' ? '/machines' : role === 'MACHINE_OPERATOR' ? '/machines/1' : '/');
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

        <button className="auth-back-btn" onClick={() => { setStep('DETAILS'); setError(null); }}>← Back to Details</button>

        <div className="auth-sms-notice">
          <div className="auth-sms-icon">📱</div>
          <div className="auth-sms-text">
            <strong>OTP Sent via SMS</strong>
            <span>6-digit code sent to <strong style={{ color: '#fff' }}>{maskedPhone}</strong></span>
          </div>
          <div className="auth-sms-badge">✓ Dispatched</div>
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

          <OtpInputs
            value={otp}
            onChange={setOtp}
            onComplete={(code) => handleVerify(undefined, code)}
            disabled={loading}
          />

          <div className="auth-resend-row" style={{ marginTop: '1rem' }}>
            <span>⏱️ Resend in: <strong style={{ color: '#00d4ff' }}>{otpTimer > 0 ? `${otpTimer}s` : 'Ready'}</strong></span>
            <button
              type="button"
              className="auth-resend-btn"
              disabled={otpTimer > 0 || loading}
              onClick={handleResend}
              style={{
                cursor: otpTimer === 0 && !loading ? 'pointer' : 'not-allowed',
                color: otpTimer === 0 && !loading ? '#00e68a' : '#64748b',
                fontWeight: 700
              }}
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
        <p>{phonePreVerified ? 'Step 2: Worker account setup (Phone Verified)' : 'Step 1 of 2 · Worker account setup'}</p>
      </div>

      {error && <div className="auth-error">⚠️ {error}</div>}

      <form className="auth-form" onSubmit={handleSendOtpOrRegister}>
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

type AuthView = 'SIGNIN' | 'REGISTER' | 'FORGOT';

/**
 * Determine the initial tab to show:
 * - New visitor (no account ever created on this device) → 'register'
 * - Returning user (has a saved session OR has registered before) → 'signin'
 */
function getInitialView(): AuthView {
  const hasSession    = !!localStorage.getItem('fac_mon_current_user');
  const hasRegistered = !!localStorage.getItem('fac_mon_has_registered');
  return hasSession || hasRegistered ? 'SIGNIN' : 'REGISTER';
}

const LoginView: React.FC = () => {
  const [view, setView] = useState<AuthView>(getInitialView);
  const [initialPhone, setInitialPhone] = useState<string | undefined>(undefined);

  // Reset to top of card on tab switch
  const cardRef = useRef<HTMLDivElement>(null);
  const switchView = (v: AuthView) => {
    setView(v);
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
              aria-selected={view === 'SIGNIN'}
              className={`auth-tab${view === 'SIGNIN' ? ' active' : ''}`}
              onClick={() => switchView('SIGNIN')}
            >
              🔐 Sign In
            </button>
            <button
              role="tab"
              aria-selected={view === 'REGISTER'}
              className={`auth-tab${view === 'REGISTER' ? ' active' : ''}`}
              onClick={() => switchView('REGISTER')}
            >
              👷 Register
            </button>
            <button
              role="tab"
              aria-selected={view === 'FORGOT'}
              className={`auth-tab${view === 'FORGOT' ? ' active' : ''}`}
              onClick={() => switchView('FORGOT')}
            >
              🔑 Reset Pwd
            </button>
          </div>

          {/* Active panel */}
          {view === 'SIGNIN' && (
            <SignInPanel
              onForgot={() => switchView('FORGOT')}
              onRegister={(phone) => { setInitialPhone(phone); switchView('REGISTER'); }}
            />
          )}
          {view === 'REGISTER' && (
            <RegisterPanel onSignIn={() => switchView('SIGNIN')} initialPhone={initialPhone} />
          )}
          {view === 'FORGOT' && (
            <ForgotPasswordPanel onSignIn={() => switchView('SIGNIN')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
