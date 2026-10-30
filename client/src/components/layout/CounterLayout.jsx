import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingCart, Calendar, Search } from 'lucide-react';
import Navbar from './Navbar';
import SEO from '../common/SEO';

export default function CounterLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg-light)' }}>
      <SEO title="Counter Staff Billing Portal" noindex={true} />
      {/* Dark Charcoal Top Header */}
      <Navbar />

      {/* POS Sub-Header Navigation Bar with Yellow Active Items */}
      <div
        className="px-2 px-sm-3 py-2 border-bottom shadow-xs sticky-top"
        style={{ backgroundColor: 'var(--bg-charcoal)', borderColor: 'var(--border-dark)', zIndex: 1030 }}
      >
        <div className="container-fluid px-0">
          <div className="d-flex flex-nowrap overflow-x-auto gap-2 py-0.5 scrollbar-hidden">
            <NavLink
              to="/counter/new-sale"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-1.5 gap-sm-2 py-1.5 py-sm-2 px-2.5 px-sm-3.5 fw-bold rounded-pill text-decoration-none transition-all extra-small flex-shrink-0 ${
                  isActive
                    ? 'btn-accent text-dark'
                    : 'text-light'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {}
                  : { backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-dark)' }
              }
            >
              <ShoppingCart size={16} />
              <span>+ New Sale Billing</span>
            </NavLink>

            <NavLink
              to="/counter/today-sales"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-1.5 gap-sm-2 py-1.5 py-sm-2 px-2.5 px-sm-3.5 fw-bold rounded-pill text-decoration-none transition-all extra-small flex-shrink-0 ${
                  isActive
                    ? 'btn-accent text-dark'
                    : 'text-light'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {}
                  : { backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-dark)' }
              }
            >
              <Calendar size={16} />
              <span>Today's Invoices</span>
            </NavLink>

            <NavLink
              to="/counter/stock-lookup"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-1.5 gap-sm-2 py-1.5 py-sm-2 px-2.5 px-sm-3.5 fw-bold rounded-pill text-decoration-none transition-all extra-small flex-shrink-0 ${
                  isActive
                    ? 'btn-accent text-dark'
                    : 'text-light'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {}
                  : { backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-dark)' }
              }
            >
              <Search size={16} />
              <span>Stock Availability</span>
            </NavLink>
          </div>
        </div>
      </div>

      <main className="flex-grow-1 overflow-x-hidden p-0" style={{ backgroundColor: 'var(--bg-light)' }}>
        <Outlet />
      </main>
    </div>
  );
}
