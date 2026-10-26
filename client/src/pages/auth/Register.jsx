import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc3, Lock, Mail, User, Phone, Car, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
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

  const { register, googleLogin, shopSettings } = useAuth();
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
        backgroundColor: '#0a0e1a',
        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.12) 0%, rgba(10, 14, 26, 0.95) 70%)`
      }}
    >
      <div className="w-100" style={{ maxWidth: '480px' }}>
        {/* Brand Banner */}
        <div className="text-center mb-4">
          <Link to="/" className="text-decoration-none d-inline-block">
            <div
              className="d-inline-flex p-3 rounded-circle text-warning mb-2 shadow-lg"
              style={{
                backgroundColor: '#131b2e',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.2)'
              }}
            >
              <Disc3 size={42} className="animate-spin-slow" />
            </div>
            <h2 className="text-white fw-black brand-font m-0 font-monospace" style={{ letterSpacing: '0.04em' }}>
              {shopSettings?.shopName || 'HIND TYRES'}
            </h2>
            <p className="text-warning small extra-small mt-0.5 fw-semibold" style={{ letterSpacing: '0.12em' }}>
              DRIVE SAFE • DRIVE FAR
            </p>
          </Link>
        </div>

        {/* Register Card */}
        <div
          className="glass-panel p-4 p-sm-5 shadow-2xl rounded-4"
          style={{
            backgroundColor: 'rgba(19, 27, 46, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h4 className="text-white fw-bold mb-0">Create Account</h4>
              <p className="text-secondary extra-small mb-0">Join for warranty tracking & tyre fitment booking</p>
            </div>
            <Link to="/" className="btn btn-sm btn-outline-secondary rounded-pill extra-small px-2.5 py-1">
              Home
            </Link>
          </div>

          {/* Google Sign-Up */}
          <div className="mb-3 text-center">
            <div className="d-flex justify-content-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign-In failed')}
                theme="filled_black"
                shape="pill"
                size="large"
                text="signup_with"
                width="100%"
              />
            </div>
            <div className="position-relative my-3">
              <hr className="border-secondary border-opacity-30 my-0" />
              <span
                className="position-absolute top-50 start-50 translate-middle px-2 extra-small text-secondary"
                style={{ backgroundColor: '#131b2e' }}
              >
                OR REGISTER WITH EMAIL
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-2.5">
              <label className="form-label text-secondary small fw-semibold">Full Name *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-warning">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-2.5">
              <label className="form-label text-secondary small fw-semibold">Email Address *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-warning">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="row g-2 mb-2.5">
              <div className="col-6">
                <label className="form-label text-secondary small fw-semibold">Phone</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-warning">
                    <Phone size={15} />
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-6">
                <label className="form-label text-secondary small fw-semibold">Vehicle Model</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary border-opacity-25 text-warning">
                    <Car size={15} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Swift / Creta"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold">Password *</label>
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-warning">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              className="btn btn-warning-glass w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-3 pt-2 border-top border-secondary border-opacity-20 extra-small text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-warning fw-bold text-decoration-none">
              Sign In Instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
