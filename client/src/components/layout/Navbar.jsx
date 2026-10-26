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
  Globe,
  Home,
  ChevronDown,
  Sparkles,
  Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAdmin, isCounter, logout, shopSettings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const dropdownRef = useRef(null);

  const isCounterRoute = location.pathname.startsWith('/counter');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPortalMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActivePortalLabel = () => {
    if (isAdminRoute) return { label: 'Admin Portal', icon: LayoutDashboard, color: 'text-warning' };
    if (isCounterRoute) return { label: 'Counter POS', icon: ShoppingCart, color: 'text-warning' };
    return { label: 'Staff Portal', icon: Shield, color: 'text-warning' };
  };

  const activePortal = getActivePortalLabel();
  const ActiveIcon = activePortal.icon;

  return (
    <nav
      className="navbar navbar-expand-lg border-bottom border-secondary border-opacity-25 px-3 py-2 sticky-top"
      style={{ backgroundColor: 'rgba(10, 14, 26, 0.95)', backdropFilter: 'blur(16px)', zIndex: 1040 }}
    >
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center gap-2">
          {/* Mobile hamburger for Admin sidebar */}
          {onToggleSidebar && (
            <button
              className="btn btn-sm btn-secondary-glass d-lg-none p-2"
              onClick={onToggleSidebar}
              aria-label="Toggle Navigation"
            >
              <Menu size={18} />
            </button>
          )}

          {/* Brand Logo with Golden Amber Tyre Icon */}
          <Link
            to={isAdmin ? '/admin/dashboard' : '/counter/new-sale'}
            className="navbar-brand d-flex align-items-center gap-2 m-0 text-decoration-none"
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: '38px', height: '38px', background: '#0a0e1a', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}
            >
              <Disc3 size={24} className="animate-spin-slow" />
            </div>
            <div>
              <div className="fw-black text-white fs-6 font-monospace lh-1" style={{ letterSpacing: '0.04em' }}>
                {shopSettings?.shopName || 'HIND TYRES'}
              </div>
              <small className="extra-small fw-semibold text-warning" style={{ fontSize: '0.62rem', letterSpacing: '0.12em' }}>
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

          {/* User Badge */}
          {user ? (
            <div className="d-flex align-items-center gap-2 px-2.5 py-1 rounded-pill bg-dark border border-secondary border-opacity-30">
              <div
                className="p-1 rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b'
                }}
              >
                {user.role === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
              </div>
              <div className="d-none d-md-block text-start lh-1 me-1">
                <div className="text-white fw-bold small">{user.name}</div>
                <span
                  className="badge px-1 py-0 extra-small text-warning"
                  style={{ fontSize: '0.65rem' }}
                >
                  {user.role === 'ADMIN' ? 'Owner / Admin' : 'Counter Staff'}
                </span>
              </div>
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

          {/* Logout */}
          {user && (
            <button
              className="btn btn-sm btn-secondary-glass p-2 text-danger rounded-circle"
              onClick={logout}
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
