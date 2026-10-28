import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc3, Lock, Mail, Eye, EyeOff, LogIn, CheckCircle2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

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
      {/* ========================================================== */}
      {/* LEFT SIDE: Black/Charcoal with Tyre Workshop & Headline */}
      {/* ========================================================== */}
      <div
        className="col-12 col-lg-6 d-flex flex-column justify-content-between p-4 p-md-5 text-white position-relative"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 10, 12, 0.94) 0%, rgba(10, 10, 12, 0.85) 60%, rgba(10, 10, 12, 0.70) 100%), url('/images/hero_tyre_workshop.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '340px',
        }}
      >
        {/* Top Logo */}
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
                {shopSettings?.shopName || 'HIND TYRES & ACCESSORIES'}
              </div>
              <div className="text-muted extra-small mt-0.5 fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                DRIVE SAFE · DRIVE FAR
              </div>
            </div>
          </Link>
        </div>

        {/* Center Headline */}
        <div className="my-4 my-lg-auto py-3">
          <div className="hero-eyebrow text-light mb-2 opacity-90">
            PREMIUM TYRES FOR A
          </div>
          <h1 className="hero-headline display-4 text-white mb-3">
            SAFER<br />
            <span style={{ color: 'var(--accent)' }}>SMOOTHER</span><br />
            JOURNEY
          </h1>
          <p className="fs-6 text-light opacity-80 mb-0" style={{ maxWidth: '420px' }}>
            Multi-brand stock inventory, instant counter billing, and genuine customer tyre durability warranty hub.
          </p>
        </div>

        {/* Bottom Trust Feature */}
        <div className="d-flex flex-wrap align-items-center gap-3 pt-3 border-top" style={{ borderColor: 'var(--border-dark)' }}>
          <div className="d-flex align-items-center gap-1.5 small text-light">
            <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
            <span>100% Genuine Tyres</span>
          </div>
          <div className="d-flex align-items-center gap-1.5 small text-light">
            <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
            <span>Certified 5-Year Warranty</span>
          </div>
          <div className="d-flex align-items-center gap-1.5 small text-light">
            <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
            <span>3D Laser Alignment</span>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* RIGHT SIDE: White Clean Form Card with Yellow Primary Sign In */}
      {/* ========================================================== */}
      <div
        className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-3 p-sm-4 p-md-5"
        style={{ backgroundColor: 'var(--bg-light)', minHeight: '100vh' }}
      >
        <div className="w-100" style={{ maxWidth: '440px' }}>
          <div
            className="card-clean p-3.5 p-sm-4 bg-white shadow-lg rounded-4"
            style={{ border: '1px solid var(--border-light)' }}
          >
            {/* Header */}
            <div
              className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <div>
                <h3 className="fw-black text-dark mb-0.5" style={{ letterSpacing: '-0.02em' }}>
                  Sign In
                </h3>
                <p className="text-muted small mb-0">Staff & Administrator Access Portal</p>
              </div>
              <Link
                to="/"
                className="btn btn-sm btn-outline-secondary rounded-pill extra-small px-3 hover-lift"
              >
                Home
              </Link>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-dark small fw-semibold mb-1.5">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ height: '44px' }}
                  />
                </div>
              </div>

              <div className="mb-3.5">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <label className="form-label text-dark small fw-semibold m-0">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-link-blue extra-small text-decoration-none"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ height: '44px' }}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-white btn btn-link text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-accent w-100 py-2.5 rounded-3 text-dark fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                style={{ height: '44px', fontSize: '0.95rem' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Clean Flex Divider */}
            <div className="d-flex align-items-center my-3.5 py-1">
              <div className="flex-grow-1 border-top" style={{ borderColor: 'var(--border-light)' }} />
              <span
                className="px-3 text-muted extra-small fw-semibold text-uppercase"
                style={{ letterSpacing: '0.06em', fontSize: '0.7rem' }}
              >
                OR CONTINUE WITH
              </span>
              <div className="flex-grow-1 border-top" style={{ borderColor: 'var(--border-light)' }} />
            </div>

            {/* Google Sign-In */}
            <div className="text-center">
              <div className="d-flex justify-content-center w-100 mb-2">
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
              <div className="extra-small text-muted text-center" style={{ fontSize: '0.74rem', lineHeight: 1.45 }}>
                ⚡ Only staff and administrator Gmail accounts authorized by the Shop Owner can sign in.
              </div>
            </div>

            {/* Bottom Security Note */}
            <div
              className="text-center mt-4 pt-3 border-top extra-small text-muted"
              style={{ borderColor: 'var(--border-light)', fontSize: '0.78rem' }}
            >
              🔒 Authorized store staff portal. Need account access? Contact the shop owner.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
