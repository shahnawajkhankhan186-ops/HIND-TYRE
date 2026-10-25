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
  Users,
  FileSpreadsheet,
  UserCheck,
  Settings,
  ShieldAlert,
  X
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/companies', icon: Building2, label: 'Tyre Companies' },
  { to: '/admin/tyres', icon: Disc3, label: 'Tyres Catalog' },
  { to: '/admin/accessories', icon: Layers, label: 'Accessories' },
  { to: '/admin/stock-in', icon: ArrowDownToLine, label: 'Stock In (Purchase)' },
  { to: '/admin/stock-adjust', icon: SlidersHorizontal, label: 'Stock Adjust' },
  { to: '/admin/stock-ledger', icon: History, label: 'Stock Ledger' },
  { to: '/admin/sales', icon: Receipt, label: 'Sales & Invoices' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/reports', icon: FileSpreadsheet, label: 'Reports & CSV' },
  { to: '/admin/users', icon: UserCheck, label: 'Admin & Staff' },
  { to: '/admin/settings', icon: Settings, label: 'Shop Settings' },
  { to: '/admin/audit-logs', icon: ShieldAlert, label: 'Audit Logs' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-lg-none"
          style={{ zIndex: 1045, backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`admin-sidebar glass-panel border-top-0 border-start-0 border-bottom-0 rounded-0 p-3 d-flex flex-column ${
          isOpen ? 'show-sidebar' : ''
        }`}
        style={{
          width: 'var(--sidebar-width)',
          zIndex: 1050,
          background: 'rgba(10, 15, 26, 0.96)',
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 d-lg-none">
          <span className="text-white fw-bold small text-uppercase">Admin Navigation</span>
          <button className="btn btn-sm text-secondary p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="text-secondary extra-small text-uppercase fw-bold px-3 mb-2" style={{ letterSpacing: '0.08em', fontSize: '0.7rem' }}>
          Management
        </div>

        <div className="nav flex-column gap-1 overflow-y-auto flex-grow-1 pe-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 992 && onClose) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={18} className="sidebar-icon" />
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="pt-3 border-top border-secondary border-opacity-25 mt-auto">
          <div className="px-3 py-2 rounded-2 bg-slate-900 bg-opacity-70 border border-secondary border-opacity-15">
            <div className="extra-small text-secondary" style={{ fontSize: '0.7rem' }}>Database Status</div>
            <div className="d-flex align-items-center gap-1.5 text-success small fw-semibold mt-0.5">
              <span className="p-1 rounded-circle bg-success d-inline-block"></span>
              MongoDB Replica Set (ACID)
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
