import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Disc3, ShoppingCart, LayoutDashboard, LogOut, User, Menu, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAdmin, logout, shopSettings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isCounterRoute = location.pathname.startsWith('/counter');

  return (
    <nav className="navbar navbar-expand-lg border-bottom border-secondary border-opacity-25 px-3 py-2 sticky-top" style={{ backgroundColor: 'rgba(8, 12, 20, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1040 }}>
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
          <Link to={isAdmin ? '/admin/dashboard' : '/counter/new-sale'} className="navbar-brand d-flex align-items-center gap-2 m-0 text-decoration-none">
            <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info border border-info border-opacity-50 d-flex align-items-center justify-content-center">
              <Disc3 size={24} className="animate-spin-slow" />
            </div>
            <div>
              <div className="fw-bold text-white fs-6 brand-font lh-1" style={{ letterSpacing: '0.02em' }}>
                {shopSettings?.shopName || 'HIND TYRES'}
              </div>
              <small className="text-info fw-semibold extra-small" style={{ fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                & ACCESSORIES ERP
              </small>
            </div>
          </Link>
        </div>

        {/* Center / Right controls */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Portal Switcher for Admins */}
          {isAdmin && (
            <div className="d-none d-sm-flex align-items-center">
              {isCounterRoute ? (
                <button
                  className="btn btn-sm btn-secondary-glass d-flex align-items-center gap-1.5"
                  onClick={() => navigate('/admin/dashboard')}
                >
                  <LayoutDashboard size={15} className="text-info" />
                  <span>Admin Portal</span>
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-primary-glass d-flex align-items-center gap-1.5"
                  onClick={() => navigate('/counter/new-sale')}
                >
                  <ShoppingCart size={15} />
                  <span>Counter POS</span>
                </button>
              )}
            </div>
          )}

          {/* User Badge */}
          <div className="d-flex align-items-center gap-2 px-2.5 py-1 rounded-pill bg-slate-800 bg-opacity-60 border border-secondary border-opacity-25">
            <div className={`p-1 rounded-circle ${user?.role === 'ADMIN' ? 'bg-primary bg-opacity-25 text-primary' : 'bg-success bg-opacity-25 text-success'}`}>
              {user?.role === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
            </div>
            <div className="d-none d-md-block text-start lh-1 me-1">
              <div className="text-white fw-semibold small">{user?.name}</div>
              <span className={`badge px-1 py-0 extra-small ${user?.role === 'ADMIN' ? 'text-primary' : 'text-success'}`} style={{ fontSize: '0.65rem' }}>
                {user?.role}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            className="btn btn-sm btn-secondary-glass p-2 text-danger"
            onClick={logout}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
