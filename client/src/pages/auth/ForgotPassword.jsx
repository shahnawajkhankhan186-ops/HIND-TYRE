import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc3, Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        toast.success(res.data.message || '6-digit OTP has been dispatched to your email.');
        setStep(2);
        setCooldown(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the full 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        toast.success('OTP verified successfully!');
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      if (res.data.success) {
        toast.success('Password successfully reset! Please sign in with your new password.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.12) 0%, #080c14 70%)' }}>
      <div className="w-100" style={{ maxWidth: '440px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 rounded-4 bg-info bg-opacity-10 border border-info border-opacity-30 text-info mb-2">
            <KeyRound size={36} />
          </div>
          <h3 className="text-white fw-bold brand-font m-0">Reset Password</h3>
          <p className="text-secondary small mt-1">HIND TYRES Account Recovery Flow</p>
        </div>

        <div className="glass-panel p-4 p-sm-5 shadow-2xl">
          {/* Step Progress Pills */}
          <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom border-secondary border-opacity-20">
            <div className={`d-flex align-items-center gap-1.5 small fw-semibold ${step >= 1 ? 'text-info' : 'text-secondary'}`}>
              <span className={`badge rounded-circle p-1.5 ${step >= 1 ? 'bg-info text-dark' : 'bg-secondary text-light'}`}>1</span>
              <span>Email</span>
            </div>
            <div className="border-top border-secondary border-opacity-25 flex-grow-1 mx-2"></div>
            <div className={`d-flex align-items-center gap-1.5 small fw-semibold ${step >= 2 ? 'text-info' : 'text-secondary'}`}>
              <span className={`badge rounded-circle p-1.5 ${step >= 2 ? 'bg-info text-dark' : 'bg-secondary text-light'}`}>2</span>
              <span>OTP</span>
            </div>
            <div className="border-top border-secondary border-opacity-25 flex-grow-1 mx-2"></div>
            <div className={`d-flex align-items-center gap-1.5 small fw-semibold ${step >= 3 ? 'text-info' : 'text-secondary'}`}>
              <span className={`badge rounded-circle p-1.5 ${step >= 3 ? 'bg-info text-dark' : 'bg-secondary text-light'}`}>3</span>
              <span>Password</span>
            </div>
          </div>

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp}>
              <p className="text-secondary small mb-3">
                Enter your account email address. We will dispatch a 6-digit one-time verification code (OTP).
              </p>
              <div className="mb-4">
                <label className="form-label text-secondary small fw-semibold">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text"><Mail size={16} /></span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@hindtyres.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary-glass w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : <>Send Verification Code <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <p className="text-secondary small mb-3">
                Enter the 6-digit OTP code sent to <strong className="text-white">{email}</strong> (valid for 10 minutes).
              </p>
              <div className="mb-4">
                <label className="form-label text-secondary small fw-semibold">6-Digit OTP</label>
                <input
                  type="text"
                  maxLength="6"
                  className="form-control text-center fs-3 font-monospace letter-spacing-2"
                  style={{ letterSpacing: '8px', fontWeight: 'bold', color: '#38bdf8' }}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="text-secondary extra-small">Didn't receive code?</span>
                  <button
                    type="button"
                    className="btn btn-link extra-small text-info p-0 text-decoration-none"
                    onClick={handleRequestOtp}
                    disabled={cooldown > 0 || loading}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary-glass flex-grow-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-glass flex-grow-1"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="d-flex align-items-center gap-2 text-success small mb-3">
                <CheckCircle2 size={16} /> OTP Verified! Set your new password.
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">New Password</label>
                <div className="input-group">
                  <span className="input-group-text"><Lock size={16} /></span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-semibold">Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text"><Lock size={16} /></span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-success-glass w-100 py-2.5"
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
              </button>
            </form>
          )}

          <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-20">
            <Link to="/login" className="text-secondary small text-decoration-none d-inline-flex align-items-center gap-1.5 hover-text-white">
              <ArrowLeft size={15} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
