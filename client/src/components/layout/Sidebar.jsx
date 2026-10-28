import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Disc3,
  Layers,
  ArrowDownToLine,
  SlidersHorizontal,
  History,
  Receipt,
  CircleDollarSign,
  Users,
  FileSpreadsheet,
  UserCheck,
  Settings,
  ShieldAlert,
  ChevronLeft,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/companies', icon: Building2, label: 'Tyre Companies' },
  { to: '/admin/tyres', icon: Disc3, label: 'Tyres Catalog' },
  { to: '/admin/accessories', icon: Layers, label: 'Accessories' },
  { to: '/admin/stock-in', icon: ArrowDownToLine, label: 'Stock In (Purchase)' },
  { to: '/admin/stock-adjust', icon: SlidersHorizontal, label: 'Stock Adjust' },
  { to: '/admin/stock-ledger', icon: History, label: 'Stock Ledger' },
  { to: '/admin/sales', icon: Receipt, label: 'Sales & Invoices' },
  { to: '/admin/finance', icon: CircleDollarSign, label: 'Finance & Profits' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/reports', icon: FileSpreadsheet, label: 'Reports & CSV' },
  { to: '/admin/users', icon: UserCheck, label: 'Admin & Staff' },
  { to: '/admin/settings', icon: Settings, label: 'Shop Settings' },
  { to: '/admin/audit-logs', icon: ShieldAlert, label: 'Audit Logs' },
];

export default function Sidebar({
  desktopOpen = true,
  mobileOpen = false,
  isOpen,
  onClose,
  onCloseMobile,
  onToggleDesktop,
}) {
  const { logout } = useAuth();
  const isMobileActive = mobileOpen || isOpen;
  const closeMobile = onCloseMobile || onClose;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileActive && (
        <div
          className="admin-mobile-backdrop d-lg-none"
          onClick={closeMobile}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`admin-sidebar ${
          desktopOpen ? 'desktop-open' : 'desktop-closed'
        } ${isMobileActive ? 'mobile-open' : ''} border-top-0 border-start-0 border-bottom-0`}
      >
        <div className="admin-sidebar-inner p-3">
          {/* Mobile Header with brand & close X */}
          <div className="d-flex justify-content-between align-items-center mb-3 d-lg-none flex-shrink-0 pb-2 border-bottom border-secondary border-opacity-20">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: '30px', height: '30px', background: '#0a0e1a', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}
              >
                <Disc3 size={18} className="animate-spin-slow" />
              </div>
              <span className="text-white fw-bold small text-uppercase font-monospace" style={{ letterSpacing: '0.05em' }}>
                Management Menu
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm text-secondary p-1.5 rounded-circle hover-glass d-flex align-items-center justify-content-center"
              onClick={closeMobile}
              aria-label="Close menu"
            >
              <X size={19} className="text-white" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="d-none d-lg-flex justify-content-between align-items-center px-2 mb-2 flex-shrink-0">
            <span className="text-secondary extra-small text-uppercase fw-bold" style={{ letterSpacing: '0.08em', fontSize: '0.7rem' }}>
              Management Features
            </span>
            {onToggleDesktop && (
              <button
                type="button"
                className="btn btn-sm p-1 text-secondary hover-glass rounded-2 d-flex align-items-center justify-content-center"
                onClick={onToggleDesktop}
                title="Collapse Sidebar"
                style={{ width: '26px', height: '26px' }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Scrollable Nav Items list */}
          <div
            className="d-flex flex-column flex-nowrap gap-1 overflow-y-auto overflow-x-hidden flex-grow-1 pe-1 py-1"
            style={{ minHeight: 0 }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 992 && closeMobile) {
                      closeMobile();
                    }
                  }}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={18} className="sidebar-icon" />
                  <span className="sidebar-label text-truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Bottom Logout Button */}
          <div className="pt-3 border-top border-secondary border-opacity-25 mt-auto flex-shrink-0">
            <button
              type="button"
              className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-2.5 px-3 rounded-2 fw-semibold transition-all"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.12)',
                border: '1px solid rgba(220, 38, 38, 0.45)',
                color: '#FCA5A5',
                fontSize: '0.875rem',
                letterSpacing: '0.02em'
              }}
              onClick={() => {
                if (window.confirm('Are you sure you want to log out of HIND TYRES?')) {
                  logout();
                }
              }}
              title="Log out of system"
            >
              <LogOut size={17} style={{ color: '#EF4444' }} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
