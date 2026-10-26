import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingCart, Calendar, Search } from 'lucide-react';
import Navbar from './Navbar';

export default function CounterLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg-light)' }}>
      {/* Dark Charcoal Top Header */}
      <Navbar />

      {/* POS Sub-Header Navigation Bar with Yellow Active Items */}
      <div
        className="px-3 py-2 border-bottom shadow-xs"
        style={{ backgroundColor: 'var(--bg-charcoal)', borderColor: 'var(--border-dark)' }}
      >
        <div className="container-fluid px-0">
          <div className="d-flex flex-wrap gap-2">
            <NavLink
              to="/counter/new-sale"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-2 py-2 px-3.5 fw-bold rounded-pill text-decoration-none transition-all ${
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
              <ShoppingCart size={18} />
              <span>+ New Sale Billing</span>
            </NavLink>

            <NavLink
              to="/counter/today-sales"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-2 py-2 px-3.5 fw-bold rounded-pill text-decoration-none transition-all ${
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
              <Calendar size={18} />
              <span>Today's Invoices</span>
            </NavLink>

            <NavLink
              to="/counter/stock-lookup"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-2 py-2 px-3.5 fw-bold rounded-pill text-decoration-none transition-all ${
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
              <Search size={18} />
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
