import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc3, Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import SEO from '../../components/common/SEO';

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
      toast.error(err.response?.data?.error || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });

      if (res.data.success) {
        toast.success('Password reset successfully! Please sign in with your new credentials.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row" style={{ backgroundColor: 'var(--bg-black)' }}>
      <SEO
        title="Account Recovery & Password Reset"
        description="Account recovery and password reset verification for HIND TYRES AND ACCESSORIES staff."
        noindex={true}
      />
      {/* Left Workshop Hero */}
      <div
        className="col-12 col-lg-6 d-flex flex-column justify-content-between p-4 p-md-5 text-white position-relative"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 10, 12, 0.94) 0%, rgba(10, 10, 12, 0.85) 60%, rgba(10, 10, 12, 0.70) 100%), url('/images/hero_tyre_workshop.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '320px',
        }}
      >
        <div>
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-card-dark)', color: 'var(--accent)' }}
            >
              <Disc3 size={24} className="animate-spin-slow" />
            </div>
            <div>
              <div className="fw-black text-white fs-5 lh-1 font-monospace" style={{ letterSpacing: '0.03em' }}>
                HIND TYRES & ACCESSORIES
              </div>
              <div className="text-muted extra-small mt-0.5 fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                DRIVE SAFE · DRIVE FAR
              </div>
            </div>
          </Link>
        </div>

        <div className="my-4 my-lg-auto py-3">
          <div className="hero-eyebrow text-light mb-2 opacity-90">
            ACCOUNT RECOVERY
          </div>
          <h1 className="hero-headline display-4 text-white mb-3">
            SECURE<br />
            <span style={{ color: 'var(--accent)' }}>PASSWORD</span><br />
            RESET
          </h1>
          <p className="fs-6 text-light opacity-80 mb-0" style={{ maxWidth: '420px' }}>
            Verify your account with a secure one-time passcode sent directly to your registered email.
          </p>
        </div>

        <div className="pt-3 border-top" style={{ borderColor: 'var(--border-dark)' }}>
          <Link to="/login" className="text-light d-flex align-items-center gap-1.5 small text-decoration-none">
            <ArrowLeft size={16} style={{ color: 'var(--accent)' }} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>

      {/* Right Form Container */}
      <div
        className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-3 p-sm-4 p-md-5"
        style={{ backgroundColor: 'var(--bg-light)' }}
      >
        <div className="w-100" style={{ maxWidth: '440px' }}>
          <div className="card-clean p-3.5 p-sm-5 bg-white shadow-md">
            <h3 className="fw-black text-dark mb-1">Reset Password</h3>
            <p className="text-muted small mb-4">Follow the 3-step verification to restore access</p>

            {/* Stepper Indicator */}
            <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
              <div className={`d-flex align-items-center gap-1.5 small fw-bold ${step >= 1 ? 'text-dark' : 'text-muted'}`}>
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: step >= 1 ? 'var(--accent)' : '#e2e8f0',
                    color: '#0A0A0C',
                    fontSize: '0.75rem',
                  }}
                >
                  1
                </span>
                <span>Email</span>
              </div>
              <div className="border-top flex-grow-1 mx-2" style={{ borderColor: 'var(--border-light)' }}></div>
              <div className={`d-flex align-items-center gap-1.5 small fw-bold ${step >= 2 ? 'text-dark' : 'text-muted'}`}>
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: step >= 2 ? 'var(--accent)' : '#e2e8f0',
                    color: '#0A0A0C',
                    fontSize: '0.75rem',
                  }}
                >
                  2
                </span>
                <span>OTP</span>
              </div>
              <div className="border-top flex-grow-1 mx-2" style={{ borderColor: 'var(--border-light)' }}></div>
              <div className={`d-flex align-items-center gap-1.5 small fw-bold ${step >= 3 ? 'text-dark' : 'text-muted'}`}>
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: step >= 3 ? 'var(--accent)' : '#e2e8f0',
                    color: '#0A0A0C',
                    fontSize: '0.75rem',
                  }}
                >
                  3
                </span>
                <span>New Password</span>
              </div>
            </div>

            {/* Step 1: Request OTP */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp}>
                <p className="text-muted small mb-3">
                  Enter your email address. We will dispatch a 6-digit one-time code.
                </p>
                <div className="mb-4">
                  <label className="form-label text-dark small fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted"><Mail size={16} /></span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-accent w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 rounded-3 text-dark fw-bold"
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : <>Send Verification Code <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <p className="text-muted small mb-3">
                  Enter the 6-digit code sent to <strong className="text-dark">{email}</strong>.
                </p>
                <div className="mb-4">
                  <label className="form-label text-dark small fw-semibold">6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-control text-center fs-3 font-monospace fw-bold"
                    style={{ letterSpacing: '8px', color: '#0A0A0C' }}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-muted extra-small">Didn't receive code?</span>
                    <button
                      type="button"
                      className="btn btn-link extra-small text-link-blue p-0"
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
                    className="btn btn-outline-secondary flex-grow-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-accent flex-grow-1 py-2 text-dark fw-bold"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="d-flex align-items-center gap-2 text-success small mb-3">
                  <CheckCircle2 size={16} /> OTP Verified! Enter your new password below.
                </div>

                <div className="mb-3">
                  <label className="form-label text-dark small fw-semibold">New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted"><Lock size={16} /></span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-dark small fw-semibold">Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted"><Lock size={16} /></span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-accent w-100 py-2.5 rounded-3 text-dark fw-bold"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Save & Sign In'}
                </button>
              </form>
            )}

            <div className="text-center mt-3 pt-2 border-top extra-small text-muted">
              Remember your password?{' '}
              <Link to="/login" className="text-link-blue fw-bold">
                Sign In →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
