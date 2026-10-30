import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Disc3,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  Shield,
  ShieldCheck,
  Globe,
  Home,
  ChevronDown,
  Sparkles,
  Phone,
  Mail,
  KeyRound,
  Lock,
  Edit3,
  Save,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, isAdmin, isCounter, logout, shopSettings, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const isCounterRoute = location.pathname.startsWith('/counter');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Sync edit form fields whenever user changes or edit mode toggles
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user, isEditing]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPortalMenu(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
        setIsEditing(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartEdit = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setIsEditing(false);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error('Admin name cannot be empty.');
      return;
    }
    if (trimmedName.length < 2) {
      toast.error('Name must be at least 2 characters long.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        name: trimmedName,
        phone: editPhone.trim(),
      });
      if (res.data?.success) {
        if (updateUser) {
          updateUser(res.data.data);
        }
        toast.success('Admin profile updated successfully! 🎉');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitial = (name) => {
    if (!name || typeof name !== 'string') return 'A';
    return name.trim().charAt(0).toUpperCase();
  };

  const getActivePortalLabel = () => {
    if (isAdminRoute) return { label: 'Admin Portal', icon: LayoutDashboard, color: 'text-warning' };
    if (isCounterRoute) return { label: 'Counter POS', icon: ShoppingCart, color: 'text-warning' };
    return { label: 'Staff Portal', icon: Shield, color: 'text-warning' };
  };

  const activePortal = getActivePortalLabel();
  const ActiveIcon = activePortal.icon;

  return (
    <nav
      className="navbar navbar-expand-lg border-bottom border-secondary border-opacity-25 px-2 px-sm-3 py-2 sticky-top"
      style={{ backgroundColor: 'rgba(10, 14, 26, 0.96)', backdropFilter: 'blur(16px)', zIndex: 1040 }}
    >
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center gap-1.5 gap-sm-2" style={{ minWidth: 0 }}>
          {/* 3-Lines (Hamburger) Toggle Button for Sidebar - Visible on Desktop AND Mobile */}
          {onToggleSidebar && (
            <button
              type="button"
              className="btn btn-sm btn-secondary-glass p-2 d-flex align-items-center justify-content-center rounded-2"
              style={{
                borderColor: isSidebarOpen ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.15)',
                backgroundColor: isSidebarOpen ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                width: '38px',
                height: '38px',
                flexShrink: 0,
              }}
              onClick={onToggleSidebar}
              aria-label="Toggle Management Menu"
              title={isSidebarOpen ? "Close Management Features (3 lines)" : "Open Management Features (3 lines)"}
            >
              <Menu size={20} style={{ color: '#f59e0b' }} />
            </button>
          )}

          {/* Brand Logo with Golden Amber Tyre Icon */}
          <Link
            to={isAdmin ? '/admin/dashboard' : '/counter/new-sale'}
            className="navbar-brand d-flex align-items-center gap-2 m-0 text-decoration-none"
            style={{ minWidth: 0 }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: '38px', height: '38px', background: '#0a0e1a', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}
            >
              <Disc3 size={24} className="animate-spin-slow" />
            </div>
            <div className="d-flex flex-column overflow-hidden" style={{ maxWidth: '180px' }}>
              <div className="fw-black text-white fs-6 font-monospace lh-1 text-truncate" style={{ letterSpacing: '0.03em' }}>
                {shopSettings?.shopName || 'HIND TYRES'}
              </div>
              <small className="extra-small fw-semibold text-warning text-truncate d-none d-sm-block" style={{ fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                DRIVE SAFE • DRIVE FAR
              </small>
            </div>
          </Link>
        </div>

        {/* Center / Right controls */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Multi-Portal Switcher */}
          {(isAdmin || isCounter) && (
            <div className="position-relative" ref={dropdownRef}>
              <button
                className="btn btn-sm btn-secondary-glass d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill"
                style={{ borderColor: 'rgba(245, 158, 11, 0.35)' }}
                onClick={() => setShowPortalMenu((prev) => !prev)}
                title="Switch Application Portal"
              >
                <ActiveIcon size={15} style={{ color: '#f59e0b' }} />
                <span className="d-none d-sm-inline fw-bold small text-white">{activePortal.label}</span>
                <ChevronDown size={14} className="text-secondary ms-1" />
              </button>

              {showPortalMenu && (
                <div
                  className="position-absolute end-0 mt-2 p-2 rounded-3 shadow-lg border"
                  style={{ minWidth: '240px', zIndex: 1060, backgroundColor: 'var(--bg-charcoal)', borderColor: 'var(--border-dark)' }}
                >
                  <div className="px-2 py-1 extra-small fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.05em', color: 'var(--accent)' }}>
                    Switch Portal
                  </div>

                  {isAdmin && (
                    <button
                      className={`btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded-2 mb-1 ${
                        isAdminRoute
                          ? 'btn-accent'
                          : 'btn-link text-white text-decoration-none'
                      }`}
                      onClick={() => {
                        setShowPortalMenu(false);
                        navigate('/admin/dashboard');
                      }}
                    >
                      <LayoutDashboard size={15} style={{ color: isAdminRoute ? '#0A0A0C' : 'var(--accent)' }} />
                      <div>
                        <div className="small fw-semibold">Admin Portal</div>
                        <div className="extra-small opacity-75">Inventory, Reports & Users</div>
                      </div>
                    </button>
                  )}

                  {(isAdmin || isCounter) && (
                    <button
                      className={`btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded-2 mb-1 ${
                        isCounterRoute
                          ? 'btn-accent'
                          : 'btn-link text-white text-decoration-none'
                      }`}
                      onClick={() => {
                        setShowPortalMenu(false);
                        navigate('/counter/new-sale');
                      }}
                    >
                      <ShoppingCart size={15} style={{ color: isCounterRoute ? '#0A0A0C' : 'var(--accent)' }} />
                      <div>
                        <div className="small fw-semibold">Counter POS Billing</div>
                        <div className="extra-small opacity-75">Live cashier invoicing</div>
                      </div>
                    </button>
                  )}

                  <div className="border-top border-secondary border-opacity-20 my-1"></div>

                  <button
                    className="btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-2 text-secondary text-decoration-none hover-glass"
                    onClick={() => {
                      setShowPortalMenu(false);
                      navigate('/');
                    }}
                  >
                    <Home size={14} />
                    <span className="small">Public Landing Page</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Circular Avatar & Profile Dropdown Card */}
          {user ? (
            <div className="position-relative" ref={profileDropdownRef}>
              <button
                type="button"
                className="btn p-0 d-flex align-items-center gap-2 rounded-pill"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title="View Admin Profile"
                aria-label="Open Admin Profile"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
              >
                {/* Circular Avatar showing First Letter */}
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle fw-black text-dark position-relative shadow-sm"
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'linear-gradient(135deg, #FFC107 0%, #D97706 100%)',
                    color: '#0A0A0C',
                    fontSize: '1.15rem',
                    fontWeight: '800',
                    border: '2px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: showProfileMenu ? '0 0 12px rgba(255, 193, 7, 0.6)' : '0 2px 8px rgba(0, 0, 0, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {getInitial(user.name)}
                  {/* Online dot indicator */}
                  <span
                    className="position-absolute bottom-0 end-0 rounded-circle bg-success border border-dark"
                    style={{ width: '10px', height: '10px' }}
                  />
                </div>

                <div className="d-none d-md-block text-start lh-1 me-1">
                  <div className="text-white fw-bold small">{user.name}</div>
                  <span
                    className="badge px-1 py-0 extra-small text-warning"
                    style={{ fontSize: '0.65rem' }}
                  >
                    {user.isPrimaryAdmin || user.email === 'hindtyre01@gmail.com'
                      ? 'Primary Admin (Owner)'
                      : user.role === 'ADMIN'
                      ? 'Administrator'
                      : 'Staff Member'}
                  </span>
                </div>

                <ChevronDown
                  size={14}
                  className="text-secondary d-none d-sm-inline"
                  style={{
                    transform: showProfileMenu ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {/* High-End Profile Dropdown Card */}
              {showProfileMenu && (
                <div
                  className="position-absolute end-0 mt-2 p-3 rounded-4 shadow-2xl border animate-fadeIn"
                  style={{
                    width: '330px',
                    maxWidth: 'calc(100vw - 24px)',
                    zIndex: 1065,
                    backgroundColor: '#14161D',
                    borderColor: 'rgba(255, 193, 7, 0.35)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {isEditing ? (
                    /* --- EDIT PROFILE MODE --- */
                    <div>
                      {/* Edit Header */}
                      <div className="d-flex align-items-center justify-content-between pb-2 border-bottom border-secondary border-opacity-25 mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-1.5 rounded-circle bg-warning bg-opacity-15 text-warning">
                            <Edit3 size={16} />
                          </div>
                          <div>
                            <h6 className="fw-bold text-white mb-0">Edit Profile</h6>
                            <small className="text-secondary" style={{ fontSize: '0.7rem' }}>
                              Update name & contact details
                            </small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary-glass p-1 rounded-circle"
                          onClick={handleCancelEdit}
                          title="Cancel editing"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Edit Form */}
                      <form onSubmit={handleSaveProfile}>
                        {/* Admin Name */}
                        <div className="mb-2.5">
                          <label className="form-label extra-small text-secondary mb-1 fw-semibold" style={{ fontSize: '0.72rem' }}>
                            Admin Full Name <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-black bg-opacity-40 border-secondary border-opacity-25 text-warning">
                              <User size={14} />
                            </span>
                            <input
                              type="text"
                              className="form-control bg-black bg-opacity-40 text-white border-secondary border-opacity-25"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="e.g. Owner (Admin)"
                              disabled={saving}
                              maxLength={50}
                              required
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Locked Gmail / Email */}
                        <div className="mb-2.5">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="form-label extra-small text-secondary mb-0 fw-semibold" style={{ fontSize: '0.72rem' }}>
                              Gmail / Email
                            </label>
                            <span
                              className="badge rounded-pill d-flex align-items-center gap-1 px-1.5 py-0.5"
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                fontSize: '0.62rem'
                              }}
                            >
                              <Lock size={10} /> Locked / Fixed
                            </span>
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-black bg-opacity-60 border-secondary border-opacity-25 text-secondary">
                              <Mail size={14} />
                            </span>
                            <input
                              type="email"
                              className="form-control border-secondary border-opacity-25"
                              value={user.email}
                              readOnly
                              disabled
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                cursor: 'not-allowed',
                                color: 'rgba(255, 255, 255, 0.65)'
                              }}
                            />
                          </div>
                          <div className="d-flex align-items-center gap-1 mt-1">
                            <Lock size={11} className="text-warning flex-shrink-0" />
                            <small className="text-secondary" style={{ fontSize: '0.67rem' }}>
                              Gmail cannot be changed. It is locked as permanent ID.
                            </small>
                          </div>
                        </div>

                        {/* Mobile Number */}
                        <div className="mb-3">
                          <label className="form-label extra-small text-secondary mb-1 fw-semibold" style={{ fontSize: '0.72rem' }}>
                            Mobile Number
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-black bg-opacity-40 border-secondary border-opacity-25 text-warning">
                              <Phone size={14} />
                            </span>
                            <input
                              type="tel"
                              className="form-control bg-black bg-opacity-40 text-white border-secondary border-opacity-25 font-monospace"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="+91 98765 43210"
                              disabled={saving}
                              maxLength={15}
                            />
                          </div>
                        </div>

                        {/* Action Buttons: Cancel and Save */}
                        <div className="d-flex gap-2 pt-2 border-top border-secondary border-opacity-25">
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary-glass w-50 py-2 rounded-2 fw-semibold"
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-sm w-50 py-2 rounded-2 fw-bold text-dark d-flex align-items-center justify-content-center gap-1.5"
                            style={{ backgroundColor: '#f59e0b', border: 'none' }}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save size={14} />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* --- VIEW PROFILE MODE --- */
                    <div>
                      {/* Top Avatar & Name */}
                      <div className="d-flex flex-column align-items-center text-center pb-3 border-bottom border-secondary border-opacity-25">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle fw-black mb-2 shadow"
                          style={{
                            width: '60px',
                            height: '60px',
                            background: 'linear-gradient(135deg, #FFC107 0%, #D97706 100%)',
                            color: '#0A0A0C',
                            fontSize: '1.6rem',
                            fontWeight: '900',
                            boxShadow: '0 0 22px rgba(245, 158, 11, 0.45)',
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}
                        >
                          {getInitial(user.name)}
                        </div>

                        <h5 className="fw-bold text-white mb-1 font-monospace">{user.name}</h5>
                        <span
                          className="badge rounded-pill fw-semibold px-2.5 py-0.5"
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.18)',
                            color: '#f59e0b',
                            fontSize: '0.72rem',
                            border: '1px solid rgba(245, 158, 11, 0.4)'
                          }}
                        >
                          {user.isPrimaryAdmin || user.email === 'hindtyre01@gmail.com'
                            ? '👑 Primary Admin (Owner)'
                            : user.role === 'ADMIN'
                            ? 'Administrator'
                            : 'Staff Member'}
                        </span>
                      </div>

                      {/* Personal Profile Details (Admin details only, no shop details) */}
                      <div className="py-3 d-flex flex-column gap-2 text-light">
                        {/* Full Name */}
                        <div className="p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-20 d-flex align-items-center gap-2.5">
                          <div className="p-1.5 rounded-circle bg-warning bg-opacity-15 text-warning flex-shrink-0">
                            <User size={15} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="extra-small text-secondary" style={{ fontSize: '0.68rem' }}>Admin Name</div>
                            <div className="small fw-semibold text-white text-truncate">{user.name}</div>
                          </div>
                        </div>

                        {/* Email / Gmail with Locked Badge */}
                        <div className="p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-20 d-flex align-items-center justify-content-between gap-2.5">
                          <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                            <div className="p-1.5 rounded-circle bg-warning bg-opacity-15 text-warning flex-shrink-0">
                              <Mail size={15} />
                            </div>
                            <div className="overflow-hidden">
                              <div className="extra-small text-secondary" style={{ fontSize: '0.68rem' }}>Gmail / Email</div>
                              <div className="small fw-semibold text-white text-truncate">{user.email}</div>
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill d-flex align-items-center gap-1 flex-shrink-0 px-2 py-1"
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              fontSize: '0.65rem'
                            }}
                            title="Gmail is permanent & locked"
                          >
                            <Lock size={10} /> Locked
                          </span>
                        </div>

                        {/* Mobile Number */}
                        <div className="p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-20 d-flex align-items-center gap-2.5">
                          <div className="p-1.5 rounded-circle bg-warning bg-opacity-15 text-warning flex-shrink-0">
                            <Phone size={15} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="extra-small text-secondary" style={{ fontSize: '0.68rem' }}>Mobile Number</div>
                            <div className="small fw-semibold text-white font-monospace">
                              {user.phone || shopSettings?.phone || '+91 98765 43210'}
                            </div>
                          </div>
                        </div>

                        {/* Account Status */}
                        <div className="p-2.5 rounded-3 bg-black bg-opacity-40 border border-secondary border-opacity-20 d-flex align-items-center gap-2.5">
                          <div className="p-1.5 rounded-circle bg-success bg-opacity-15 text-success flex-shrink-0">
                            <ShieldCheck size={15} />
                          </div>
                          <div>
                            <div className="extra-small text-secondary" style={{ fontSize: '0.68rem' }}>Account Status</div>
                            <div className="small fw-semibold text-success d-flex align-items-center gap-1">
                              <span>Active & Verified</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions: Edit Profile, Forgot Password & Log Out */}
                      <div className="pt-2 border-top border-secondary border-opacity-25 d-flex flex-column gap-2">
                        {/* Edit Profile Button */}
                        <button
                          type="button"
                          className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-2 fw-bold text-dark shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #FFC107 0%, #D97706 100%)',
                            border: 'none',
                          }}
                          onClick={handleStartEdit}
                        >
                          <Edit3 size={15} />
                          <span>Edit Profile</span>
                        </button>

                        {/* Forgot / Reset Password Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-2 fw-semibold"
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/forgot-password');
                          }}
                        >
                          <KeyRound size={15} />
                          <span>Forgot / Reset Password</span>
                        </button>

                        {/* Log Out Button */}
                        <button
                          type="button"
                          className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-2 fw-semibold"
                          style={{
                            backgroundColor: 'rgba(220, 38, 38, 0.12)',
                            border: '1px solid rgba(220, 38, 38, 0.35)',
                            color: '#FCA5A5'
                          }}
                          onClick={() => {
                            setShowProfileMenu(false);
                            if (window.confirm('Are you sure you want to log out of HIND TYRES?')) {
                              logout();
                            }
                          }}
                        >
                          <LogOut size={15} style={{ color: '#EF4444' }} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill text-dark shadow-sm"
              style={{ backgroundColor: '#f59e0b' }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
