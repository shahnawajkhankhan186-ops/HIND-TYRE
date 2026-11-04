import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc3, Lock, Mail, Eye, EyeOff, LogIn, CheckCircle2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/common/SEO';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, googleLogin, shopSettings } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'COUNTER') {
        navigate('/counter/new-sale');
      } else {
        toast.error('Access denied. Only registered staff and administrators can access the portal.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.friendlyMessage || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const user = await googleLogin(credentialResponse.credential);
      toast.success(`Signed in with Google! Welcome, ${user.name}`);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'COUNTER') {
        navigate('/counter/new-sale');
      } else {
        toast.error('Access denied. Only registered staff and administrators can access the portal.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.friendlyMessage || err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row" style={{ backgroundColor: 'var(--bg-black)' }}>
      <SEO
        title="Staff & Admin Portal Sign In"
        description="Internal staff and administration authentication portal for HIND TYRES AND ACCESSORIES."
        noindex={true}
      />
      {/* ========================================================== */}
      {/* LEFT SIDE: Black/Charcoal with Tyre Workshop & Headline */}
      {/* ========================================================== */}
      <div
        className="col-12 col-lg-6 d-flex flex-column justify-content-between text-white position-relative"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 10, 12, 0.94) 0%, rgba(10, 10, 12, 0.85) 60%, rgba(10, 10, 12, 0.70) 100%), url('/images/hero_tyre_workshop.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '10px 14px',
          minHeight: '260px',
        }}
      >
        {/* Top Logo */}
        <div>
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: '36px', height: '36px', backgroundColor: 'var(--bg-card-dark)', color: 'var(--accent)' }}
            >
              <Disc3 size={22} className="animate-spin-slow" />
            </div>
            <div>
              <div className="fw-black text-white fs-5 lh-1 font-monospace" style={{ letterSpacing: '0.03em' }}>
                {shopSettings?.shopName || 'HIND TYRES & ACCESSORIES'}
              </div>
              <div className="text-muted extra-small mt-0.5 fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                DRIVE SAFE · DRIVE FAR
              </div>
            </div>
          </Link>
        </div>

        {/* Center Headline */}
        <div style={{ margin: '10px 0' }}>
          <div className="hero-eyebrow text-light mb-1 opacity-90" style={{ fontSize: '0.72rem' }}>
            PREMIUM TYRES FOR A
          </div>
          <h1 className="hero-headline display-4 text-white mb-2" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: '1.15' }}>
            SAFER<br />
            <span style={{ color: 'var(--accent)' }}>SMOOTHER</span><br />
            JOURNEY
          </h1>
          <p className="small text-light opacity-80 mb-0" style={{ maxWidth: '420px', fontSize: '0.82rem' }}>
            Multi-brand stock inventory, instant counter billing, and genuine customer tyre durability warranty hub.
          </p>
        </div>

        {/* Bottom Trust Feature */}
        <div className="d-flex flex-wrap align-items-center border-top" style={{ borderColor: 'var(--border-dark)', paddingTop: '10px', gap: '10px' }}>
          <div className="d-flex align-items-center gap-1.5 extra-small text-light" style={{ fontSize: '0.75rem' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
            <span>100% Genuine Tyres</span>
          </div>
          <div className="d-flex align-items-center gap-1.5 extra-small text-light" style={{ fontSize: '0.75rem' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
            <span>Certified 5-Year Warranty</span>
          </div>
          <div className="d-flex align-items-center gap-1.5 extra-small text-light" style={{ fontSize: '0.75rem' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
            <span>3D Laser Alignment</span>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* RIGHT SIDE: White Clean Form Card with Yellow Primary Sign In */}
      {/* ========================================================== */}
      <div
        className="col-12 col-lg-6 d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: 'var(--bg-light)',
          padding: '10px',
          minHeight: 'auto',
        }}
      >
        <div className="w-100" style={{ maxWidth: '440px' }}>
          <div
            className="card-clean bg-white shadow-sm"
            style={{
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              padding: '10px 14px',
            }}
          >
            {/* Header */}
            <div
              className="d-flex align-items-center justify-content-between border-bottom"
              style={{
                borderColor: 'var(--border-light)',
                paddingBottom: '10px',
                marginBottom: '10px',
              }}
            >
              <div>
                <h3 className="fw-black text-dark mb-0.5" style={{ letterSpacing: '-0.02em', fontSize: '1.2rem' }}>
                  Sign In
                </h3>
                <p className="text-muted extra-small mb-0" style={{ fontSize: '0.78rem' }}>
                  Staff & Administrator Access Portal
                </p>
              </div>
              <Link
                to="/"
                className="btn btn-sm btn-outline-secondary rounded-pill extra-small hover-lift"
                style={{ fontSize: '0.78rem', padding: '4px 12px' }}
              >
                Home
              </Link>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label className="form-label text-dark small fw-semibold" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                  Email Address
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-muted">
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ height: '38px', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '4px' }}>
                  <label className="form-label text-dark small fw-semibold m-0" style={{ fontSize: '0.78rem' }}>
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-link-blue extra-small text-decoration-none"
                    style={{ fontSize: '0.74rem' }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-muted">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ height: '38px', fontSize: '0.84rem' }}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-white btn btn-link text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-accent w-100 rounded-3 text-dark fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                style={{ height: '40px', fontSize: '0.9rem', marginBottom: '10px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Clean Flex Divider */}
            <div className="d-flex align-items-center" style={{ margin: '10px 0' }}>
              <div className="flex-grow-1 border-top" style={{ borderColor: 'var(--border-light)' }} />
              <span
                className="px-2.5 text-muted extra-small fw-semibold text-uppercase"
                style={{ letterSpacing: '0.06em', fontSize: '0.68rem' }}
              >
                OR CONTINUE WITH
              </span>
              <div className="flex-grow-1 border-top" style={{ borderColor: 'var(--border-light)' }} />
            </div>

            {/* Google Sign-In */}
            <div className="text-center" style={{ marginBottom: '10px' }}>
              <div className="d-flex justify-content-center w-100" style={{ marginBottom: '6px' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google Sign-In failed')}
                  theme="outline"
                  shape="pill"
                  size="large"
                  text="continue_with"
                  width="100%"
                />
              </div>
              <div className="extra-small text-muted text-center" style={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                ⚡ Only staff and administrator Gmail accounts authorized by the Shop Owner can sign in.
              </div>
            </div>

            {/* Bottom Security Note */}
            <div
              className="text-center border-top extra-small text-muted"
              style={{
                borderColor: 'var(--border-light)',
                fontSize: '0.75rem',
                marginTop: '10px',
                paddingTop: '10px',
              }}
            >
              🔒 Authorized store staff portal. Need account access? Contact the shop owner.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
