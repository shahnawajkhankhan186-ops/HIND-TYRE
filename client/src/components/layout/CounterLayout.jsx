import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingCart, Calendar, Search } from 'lucide-react';
import Navbar from './Navbar';

export default function CounterLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column bg-dark-base">
      <Navbar />

      {/* Simplified Big-Button POS Navigation for Counter Staff */}
      <div className="border-bottom border-secondary border-opacity-25 px-3 py-2 bg-slate-900 bg-opacity-75">
        <div className="container-fluid px-0">
          <div className="d-flex flex-wrap gap-2">
            <NavLink
              to="/counter/new-sale"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-2 py-2 px-3 fw-bold rounded-pill text-decoration-none ${
                  isActive ? 'btn-primary-glass' : 'btn-secondary-glass'
                }`
              }
            >
              <ShoppingCart size={18} />
              <span>+ New Sale Billing</span>
            </NavLink>

            <NavLink
              to="/counter/today-sales"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-2 py-2 px-3 fw-semibold rounded-pill text-decoration-none ${
                  isActive ? 'btn-primary-glass' : 'btn-secondary-glass'
                }`
              }
            >
              <Calendar size={18} />
              <span>Today's Invoices</span>
            </NavLink>

            <NavLink
              to="/counter/stock-lookup"
              className={({ isActive }) =>
                `btn d-flex align-items-center gap-2 py-2 px-3 fw-semibold rounded-pill text-decoration-none ${
                  isActive ? 'btn-primary-glass' : 'btn-secondary-glass'
                }`
              }
            >
              <Search size={18} />
              <span>Stock Availability</span>
            </NavLink>
          </div>
        </div>
      </div>

      <main className="flex-grow-1 overflow-x-hidden p-0">
        <Outlet />
      </main>
    </div>
  );
}
