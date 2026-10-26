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
  Sparkles
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
  const isPortalRoute = location.pathname.startsWith('/portal');

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
    if (isAdminRoute) return { label: 'Admin Portal', icon: LayoutDashboard, color: 'text-info' };
    if (isCounterRoute) return { label: 'Counter POS', icon: ShoppingCart, color: 'text-warning' };
    if (isPortalRoute) return { label: 'Customer Portal', icon: Globe, color: 'text-success' };
    return { label: 'Explore Portal', icon: Sparkles, color: 'text-primary' };
  };

  const activePortal = getActivePortalLabel();
  const ActiveIcon = activePortal.icon;

  return (
    <nav
      className="navbar navbar-expand-lg border-bottom border-secondary border-opacity-25 px-3 py-2 sticky-top"
      style={{ backgroundColor: 'rgba(8, 12, 20, 0.90)', backdropFilter: 'blur(16px)', zIndex: 1040 }}
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

          {/* Brand Logo */}
          <Link
            to={isAdmin ? '/admin/dashboard' : isCounter ? '/counter/new-sale' : '/portal'}
            className="navbar-brand d-flex align-items-center gap-2 m-0 text-decoration-none"
          >
            <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info border border-info border-opacity-50 d-flex align-items-center justify-content-center">
              <Disc3 size={24} className="animate-spin-slow" />
            </div>
            <div>
              <div className="fw-bold text-white fs-6 brand-font lh-1" style={{ letterSpacing: '0.02em' }}>
                {shopSettings?.shopName || 'HIND TYRES'}
              </div>
              <small className="text-info fw-semibold extra-small" style={{ fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                & ACCESSORIES
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
                className="btn btn-sm btn-secondary-glass d-flex align-items-center gap-1.5 px-2.5 py-1.5"
                onClick={() => setShowPortalMenu((prev) => !prev)}
                title="Switch Application Portal"
              >
                <ActiveIcon size={15} className={activePortal.color} />
                <span className="d-none d-sm-inline fw-semibold small text-white">{activePortal.label}</span>
                <ChevronDown size={14} className="text-secondary ms-1" />
              </button>

              {showPortalMenu && (
                <div
                  className="position-absolute end-0 mt-2 p-2 rounded-3 shadow-2xl glass-modal border border-secondary border-opacity-30"
                  style={{ minWidth: '220px', zIndex: 1060, background: 'rgba(12, 18, 30, 0.98)' }}
                >
                  <div className="px-2 py-1 text-secondary extra-small fw-bold text-uppercase" style={{ fontSize: '0.68rem' }}>
                    Switch Portal
                  </div>

                  {isAdmin && (
                    <button
                      className={`btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded-2 mb-1 ${
                        isAdminRoute ? 'btn-primary-glass text-info' : 'btn-link text-light text-decoration-none hover-glass'
                      }`}
                      onClick={() => {
                        setShowPortalMenu(false);
                        navigate('/admin/dashboard');
                      }}
                    >
                      <LayoutDashboard size={15} className="text-info" />
                      <div>
                        <div className="small fw-semibold">Admin Portal</div>
                        <div className="extra-small text-secondary">Analytics, stock & controls</div>
                      </div>
                    </button>
                  )}

                  {(isAdmin || isCounter) && (
                    <button
                      className={`btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded-2 mb-1 ${
                        isCounterRoute ? 'btn-primary-glass text-warning' : 'btn-link text-light text-decoration-none hover-glass'
                      }`}
                      onClick={() => {
                        setShowPortalMenu(false);
                        navigate('/counter/new-sale');
                      }}
                    >
                      <ShoppingCart size={15} className="text-warning" />
                      <div>
                        <div className="small fw-semibold">Counter POS Billing</div>
                        <div className="extra-small text-secondary">Live cashier invoicing</div>
                      </div>
                    </button>
                  )}

                  <button
                    className={`btn btn-sm w-100 text-start d-flex align-items-center gap-2 px-2.5 py-2 rounded-2 mb-1 ${
                      isPortalRoute ? 'btn-primary-glass text-success' : 'btn-link text-light text-decoration-none hover-glass'
                    }`}
                    onClick={() => {
                      setShowPortalMenu(false);
                      navigate('/portal');
                    }}
                  >
                    <Globe size={15} className="text-success" />
                    <div>
                      <div className="small fw-semibold">Customer Showcase</div>
                      <div className="extra-small text-secondary">Tyre quality, features & lifespan</div>
                    </div>
                  </button>

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
            <div className="d-flex align-items-center gap-2 px-2.5 py-1 rounded-pill bg-slate-800 bg-opacity-60 border border-secondary border-opacity-25">
              <div
                className={`p-1 rounded-circle ${
                  user.role === 'ADMIN'
                    ? 'bg-primary bg-opacity-25 text-primary'
                    : user.role === 'COUNTER'
                    ? 'bg-warning bg-opacity-25 text-warning'
                    : 'bg-success bg-opacity-25 text-success'
                }`}
              >
                {user.role === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
              </div>
              <div className="d-none d-md-block text-start lh-1 me-1">
                <div className="text-white fw-semibold small">{user.name}</div>
                <span
                  className={`badge px-1 py-0 extra-small ${
                    user.role === 'ADMIN' ? 'text-primary' : user.role === 'COUNTER' ? 'text-warning' : 'text-success'
                  }`}
                  style={{ fontSize: '0.65rem' }}
                >
                  {user.role === 'ADMIN' ? 'Owner / Admin' : user.role === 'COUNTER' ? 'Counter Staff' : 'Customer'}
                </span>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm btn-primary-glass">
              Sign In
            </Link>
          )}

          {/* Logout */}
          {user && (
            <button
              className="btn btn-sm btn-secondary-glass p-2 text-danger"
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
