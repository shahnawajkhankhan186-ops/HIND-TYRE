import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc3, Lock, Mail, Eye, EyeOff, Shield, User, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, googleLogin } = useAuth();
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
      } else {
        navigate('/counter/new-sale');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Invalid credentials');
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
      } else {
        navigate('/counter/new-sale');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.success(`Filled demo credentials for ${demoEmail}`);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(56, 189, 248, 0.12) 0%, #080c14 70%)' }}>
      <div className="w-100" style={{ maxWidth: '440px' }}>
        {/* Brand Banner */}
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 rounded-4 bg-info bg-opacity-10 border border-info border-opacity-30 text-info mb-3 shadow-lg shadow-cyan">
            <Disc3 size={44} className="animate-spin-slow" />
          </div>
          <h2 className="text-white fw-bold brand-font m-0" style={{ letterSpacing: '0.02em' }}>
            HIND TYRES & ACCESSORIES
          </h2>
          <p className="text-secondary small mt-1">Multi-Company Stock, Billing & GST Management</p>
        </div>

        {/* Login Glass Card */}
        <div className="glass-panel p-4 p-sm-5 shadow-2xl border-opacity-20">
          <h4 className="text-white fw-bold mb-1">Sign In</h4>
          <p className="text-secondary small mb-4">Access Counter POS or Administrator Portal</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
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
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-secondary small fw-semibold m-0">Password</label>
                <Link to="/forgot-password" className="text-info extra-small text-decoration-none">
                  Forgot password?
                </Link>
              </div>
              <div className="input-group">
                <span className="input-group-text"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-group-text btn btn-link text-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary-glass w-100 py-2.5 mt-2 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to System <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google Sign-in Option */}
          <div className="mt-3">
            <div className="d-flex align-items-center my-3">
              <div className="flex-grow-1 border-top border-secondary border-opacity-25" />
              <span className="px-3 text-secondary extra-small text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                Or continue with
              </span>
              <div className="flex-grow-1 border-top border-secondary border-opacity-25" />
            </div>

            <div className="d-flex justify-content-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign-In was unsuccessful')}
                theme="filled_black"
                shape="pill"
                size="large"
                text="signin_with"
                width="100%"
              />
            </div>
          </div>

          {/* Quick Demo Fill Buttons (As Required by Spec) */}
          <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
            <div className="text-secondary extra-small text-uppercase fw-bold text-center mb-2.5" style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
              ⚡ Quick-Fill Demo Logins
            </div>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-sm btn-secondary-glass d-flex align-items-center justify-content-between px-3 py-2 text-start"
                onClick={() => handleQuickFill('admin@hindtyres.com', 'Admin@123')}
              >
                <div className="d-flex align-items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  <div>
                    <div className="text-white fw-semibold small">Shop Owner (Admin)</div>
                    <div className="text-secondary extra-small">admin@hindtyres.com</div>
                  </div>
                </div>
                <span className="badge bg-primary bg-opacity-20 text-primary">Admin@123</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary-glass d-flex align-items-center justify-content-between px-3 py-2 text-start"
                onClick={() => handleQuickFill('counter@hindtyres.com', 'Counter@123')}
              >
                <div className="d-flex align-items-center gap-2">
                  <User size={16} className="text-success" />
                  <div>
                    <div className="text-white fw-semibold small">Cashier (Counter Staff)</div>
                    <div className="text-secondary extra-small">counter@hindtyres.com</div>
                  </div>
                </div>
                <span className="badge bg-success bg-opacity-20 text-success">Counter@123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
