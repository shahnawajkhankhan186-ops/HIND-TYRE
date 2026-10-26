import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc3, Lock, Mail, User, Phone, Car, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleModel: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      return toast.error('Please fill in all required fields.');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }

    try {
      setLoading(true);
      const user = await register(formData);
      toast.success(`Account created! Welcome, ${user.name}`);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'COUNTER') {
        navigate('/counter/new-sale');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.friendlyMessage || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const user = await googleLogin(credentialResponse.credential);
      toast.success(`Welcome to HIND TYRES, ${user.name}!`);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'COUNTER') {
        navigate('/counter/new-sale');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.friendlyMessage || err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, rgba(56, 189, 248, 0.15) 0%, #080c14 75%)',
      }}
    >
      <div className="w-100" style={{ maxWidth: '480px' }}>
        {/* Brand Banner */}
        <div className="text-center mb-4">
          <Link to="/" className="text-decoration-none">
            <div className="d-inline-flex p-3 rounded-4 bg-info bg-opacity-10 border border-info border-opacity-30 text-info mb-2 shadow-lg shadow-cyan">
              <Disc3 size={42} className="animate-spin-slow" />
            </div>
            <h3 className="text-white fw-bold brand-font m-0" style={{ letterSpacing: '0.02em' }}>
              HIND TYRES & ACCESSORIES
            </h3>
          </Link>
          <p className="text-secondary small mt-1">
            Create your account for personalized tyre fitments & warranty records
          </p>
        </div>

        {/* Register Glass Panel */}
        <div className="glass-panel p-4 p-sm-5 shadow-2xl border-opacity-20">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="text-white fw-bold m-0">Create Account</h4>
              <p className="text-secondary extra-small m-0 mt-0.5">Instant access to customer showcase & digital receipts</p>
            </div>
            <span className="badge badge-glass-cyan extra-small">Customer Portal</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Full Name *</label>
              <div className="input-group">
                <span className="input-group-text"><User size={16} /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Gmail / Email Address *</label>
              <div className="input-group">
                <span className="input-group-text"><Mail size={16} /></span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="rahul@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <small className="text-secondary extra-small">
                Owner email <code>prolemda@gmail.com</code> automatically receives Super Admin rights.
              </small>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label text-secondary small fw-semibold">Mobile Number</label>
                <div className="input-group">
                  <span className="input-group-text"><Phone size={15} /></span>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="10-digit phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label text-secondary small fw-semibold">Vehicle Model</label>
                <div className="input-group">
                  <span className="input-group-text"><Car size={15} /></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Swift / Creta / Splendor"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Password *</label>
              <div className="input-group">
                <span className="input-group-text"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
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
              className="btn btn-primary-glass w-100 py-2.5 mt-3 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                <>
                  Register & Open Portal <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google Sign-in */}
          <div className="mt-3">
            <div className="d-flex align-items-center my-3">
              <div className="flex-grow-1 border-top border-secondary border-opacity-25" />
              <span className="px-3 text-secondary extra-small text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                Or sign up with
              </span>
              <div className="flex-grow-1 border-top border-secondary border-opacity-25" />
            </div>

            <div className="d-flex justify-content-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google registration failed')}
                theme="filled_black"
                shape="pill"
                size="large"
                text="signup_with"
                width="100%"
              />
            </div>
          </div>

          {/* Links */}
          <div className="mt-4 pt-3 border-top border-secondary border-opacity-20 text-center">
            <span className="text-secondary small">Already have an account? </span>
            <Link to="/login" className="text-info fw-semibold text-decoration-none small">
              Sign In here
            </Link>
          </div>

          <div className="text-center mt-2">
            <Link to="/" className="text-secondary extra-small text-decoration-none">
              ← Back to Main Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
