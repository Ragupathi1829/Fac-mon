import React, { useState, useEffect } from 'react';
import type { UserRole } from '../types/machine';
import { authApi } from '../services/api';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<UserRole>('MACHINE_OPERATOR');
  const [department, setDepartment] = useState('Production');
  const [designation, setDesignation] = useState('Operator');
  const [shift, setShift] = useState('Morning Shift (06:00 - 14:00)');
  const [factoryLocation, setFactoryLocation] = useState('SmartFactory Unit 1 · Chennai');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // OTP State
  const [userOtp, setUserOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState('');

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'OTP' && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  if (!isOpen) return null;

  const maskPhoneNumber = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return '+91 ******' + cleaned.slice(-4);
    }
    return raw;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = phone.replace(/\D/g, '');
    if (!fullName || !email || !password || digitsOnly.length < 10 || !employeeId) {
      setError('Please fill in all mandatory fields with a valid 10-digit phone number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const res = await authApi.sendOtp(phone.trim());
      if (res.success) {
        setStep('OTP');
        setOtpTimer(60);
        setUserOtp(['', '', '', '', '', '']);
        setMaskedPhone(maskPhoneNumber(phone.trim()));
        setOtpNotice(`📱 OTP sent to ${maskPhoneNumber(phone.trim())}. Valid for 5 minutes.`);
      } else {
        setError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;
    const char = cleaned.length > 0 ? cleaned.charAt(cleaned.length - 1) : '';
    const newOtp = [...userOtp];
    newOtp[index] = char;
    setUserOtp(newOtp);

    // Auto-focus next input field
    if (char && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !userOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    const digits = pasted.slice(0, 6).split('');
    const newOtp = [...userOtp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digits[i] || '';
    }
    setUserOtp(newOtp);
    const target = Math.min(digits.length, 5);
    document.getElementById(`otp-input-${target}`)?.focus();
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0 || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await authApi.sendOtp(phone.trim());
      if (res.success) {
        setOtpTimer(60);
        setUserOtp(['', '', '', '', '', '']);
        setOtpNotice(`📱 New OTP sent to ${maskPhoneNumber(phone.trim())}. Valid for 5 minutes.`);
      } else {
        setError(res.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = userOtp.join('');

    if (enteredCode.length < 6) {
      setError('Please enter the full 6-digit OTP verification code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await authApi.verifyOtp(phone.trim(), enteredCode);
      if (res.success) {
        completeRegistration();
      } else {
        setError(res.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const completeRegistration = async () => {
    const newUser = {
      fullName,
      email,
      phone,
      password,
      role,
      department,
      designation,
      factoryLocation,
    };
    
    setIsVerifying(true);
    setError(null);
    try {
      const res = await authApi.register(newUser);
      
      const returnedUser = {
        id: res.userId || res.id || Date.now(),
        employeeId: employeeId || res.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName,
        email,
        phone,
        role,
        department,
        designation,
        shift,
        factoryLocation,
      };
      
      onSuccess(returnedUser);
      onClose();
      setStep('DETAILS');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ background: '#0f172a', border: '1px solid rgba(0,212,255,0.35)', borderRadius: '16px', width: '90%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', color: '#ffffff' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#00d4ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {step === 'DETAILS' ? '👷 New Worker Registration' : '🔐 2-Factor OTP Verification'}
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {step === 'DETAILS' ? 'Step 1 of 2: Worker Account Specifications' : `Step 2 of 2: Verify code sent to ${maskedPhone}`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,59,106,0.15)', border: '1px solid rgba(255,59,106,0.3)', color: '#ff3b6a', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1: REGISTRATION DETAILS FORM */}
        {step === 'DETAILS' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Full Name *</label>
              <input className="form-input" placeholder="e.g. Ramesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Official Email *</label>
                <input className="form-input" type="email" placeholder="e.g. ramesh@factory.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Phone (+91 OTP) *</label>
                <input className="form-input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Employee ID *</label>
                <input className="form-input" placeholder="e.g. EMP-1010" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Factory Location *</label>
                <select className="form-select" value={factoryLocation} onChange={e => setFactoryLocation(e.target.value)} required>
                  <option value="SmartFactory Unit 1 · Chennai">SmartFactory Unit 1 · Chennai</option>
                  <option value="SmartFactory Unit 2 · Pune">SmartFactory Unit 2 · Pune</option>
                  <option value="SmartFactory Unit 3 · Bangalore">SmartFactory Unit 3 · Bangalore</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Security Password *</label>
                <input className="form-input" type="password" placeholder="Create passkey" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Confirm Password *</label>
                <input className="form-input" type="password" placeholder="Re-enter passkey" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Factory Role</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value as UserRole)}>
                  <option value="MACHINE_OPERATOR">Machine Operator</option>
                  <option value="MAINTENANCE_ENGINEER">Maintenance Engineer</option>
                  <option value="QUALITY_INSPECTOR">Quality Inspector</option>
                  <option value="PRODUCTION_MANAGER">Factory Manager</option>
                  <option value="ADMIN">Factory Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Department *</label>
                <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)} required>
                  <option value="Administration">Administration</option>
                  <option value="Production">Production</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Safety">Safety</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="IT">IT</option>
                  <option value="Operations">Operations</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Designation *</label>
                <select className="form-select" value={designation} onChange={e => setDesignation(e.target.value)} required>
                  <option value="Factory Administrator">Factory Administrator</option>
                  <option value="Plant Manager">Plant Manager</option>
                  <option value="Production Manager">Production Manager</option>
                  <option value="Maintenance Manager">Maintenance Manager</option>
                  <option value="Shift Supervisor">Shift Supervisor</option>
                  <option value="Engineer">Engineer</option>
                  <option value="Technician">Technician</option>
                  <option value="Operator">Operator</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Sustainability Manager">Sustainability Manager</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Shift</label>
                <select className="form-select" value={shift} onChange={e => setShift(e.target.value)}>
                  <option value="Morning Shift (06:00 - 14:00)">Morning Shift</option>
                  <option value="Evening Shift (14:00 - 22:00)">Evening Shift</option>
                  <option value="Night Shift (22:00 - 06:00)">Night Shift</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ffffff', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                style={{ background: isSending ? 'rgba(0,230,138,0.4)' : 'linear-gradient(135deg, #00e68a, #00d4ff)', border: 'none', color: '#000000', padding: '0.6rem 1.4rem', borderRadius: '8px', cursor: isSending ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {isSending ? '⏳ Sending OTP...' : '📱 Proceed to OTP Verification →'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', padding: '0.5rem 0' }}>

            {/* SMS Sent Banner */}
            {otpNotice && (
              <div style={{ width: '100%', background: 'rgba(0,230,138,0.1)', border: '1px solid rgba(0,230,138,0.4)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,230,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                  📱
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, color: '#00e68a', fontSize: '0.85rem' }}>OTP Sent via SMS</p>
                  <p style={{ margin: '0.15rem 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    A 6-digit code was sent to <strong style={{ color: '#ffffff' }}>{phone}</strong>
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(0,230,138,0.15)', border: '1px solid rgba(0,230,138,0.3)', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.65rem', color: '#00e68a', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  ✓ SMS Dispatched
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
              <p style={{ fontSize: '0.9rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 700 }}>
                Enter Verification Code
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                6-digit code sent to <strong style={{ color: '#00d4ff' }}>{maskedPhone}</strong>
              </p>

              {/* 6 Digit Code Inputs */}
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', margin: '1.25rem 0 0.5rem' }}>
                {userOtp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    aria-label={`OTP Digit ${idx + 1}`}
                    style={{
                      width: '46px',
                      height: '54px',
                      borderRadius: '10px',
                      background: digit ? 'rgba(0,230,138,0.12)' : 'rgba(255,255,255,0.06)',
                      border: digit ? '2px solid #00e68a' : '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      outline: 'none',
                      boxShadow: digit ? '0 0 14px rgba(0,230,138,0.35)' : 'none',
                      transition: 'all 0.2s ease',
                      caretColor: '#00e68a'
                    }}
                  />
                ))}
              </div>

              {/* Dev-mode hint */}
              <div style={{ background: 'rgba(255,180,0,0.08)', border: '1px dashed rgba(255,180,0,0.35)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.7rem', color: '#ffb020', marginTop: '0.75rem', textAlign: 'left' }}>
                🧪 <strong>Dev Mode:</strong> Check backend console logs for the OTP. When backend is offline, use <strong>123456</strong>. Real SMS via Twilio when <code>twilio.enabled=true</code>.
              </div>
            </div>

            {/* Timer & Resend Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>
                ⏱️ Resend code in: <strong style={{ color: '#00d4ff' }}>{otpTimer}s</strong>
              </span>
              <button
                type="button"
                disabled={otpTimer > 0 || isSending}
                onClick={handleResendOtp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: otpTimer === 0 ? '#00e68a' : '#64748b',
                  fontWeight: 700,
                  cursor: otpTimer === 0 ? 'pointer' : 'not-allowed',
                  textDecoration: otpTimer === 0 ? 'underline' : 'none'
                }}
              >
                {isSending ? '⏳ Sending...' : '🔄 Resend OTP'}
              </button>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ffffff', padding: '0.65rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                style={{ flex: 1, background: isVerifying ? 'rgba(0,230,138,0.4)' : 'linear-gradient(135deg, #00e68a, #00d4ff)', border: 'none', color: '#000000', padding: '0.65rem 1.4rem', borderRadius: '8px', cursor: isVerifying ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: '0.88rem' }}
              >
                {isVerifying ? '⏳ Verifying...' : '✅ Verify OTP & Register Worker'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default RegisterModal;
