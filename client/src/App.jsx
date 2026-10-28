import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import CounterLayout from './components/layout/CounterLayout';

// Public & Landing Page
import Landing from './pages/public/Landing';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Counter Portal Pages
import NewSale from './pages/counter/NewSale';
import TodaySales from './pages/counter/TodaySales';
import StockAvailability from './pages/counter/StockAvailability';

// Admin Portal Pages
import Dashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/Companies';
import Tyres from './pages/admin/Tyres';
import Accessories from './pages/admin/Accessories';
import StockIn from './pages/admin/StockIn';
import StockAdjust from './pages/admin/StockAdjust';
import StockLedger from './pages/admin/StockLedger';
import SalesLedger from './pages/admin/SalesLedger';
import Finance from './pages/admin/Finance';
import Customers from './pages/admin/Customers';
import Reports from './pages/admin/Reports';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0A0A0C' }}>
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading system...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            fontSize: '0.875rem',
          },
        }}
      />

      <Routes>
        {/* Public Showcase & Landing */}
        <Route path="/" element={<Landing />} />

        {/* Customer Portal removed - Redirect to Landing */}
        <Route path="/portal" element={<Navigate to="/" replace />} />

        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            !user ? (
              <Login />
            ) : (
              <Navigate
                to={user.role === 'ADMIN' ? '/admin/dashboard' : '/counter/new-sale'}
                replace
              />
            )
          }
        />
        <Route
          path="/register"
          element={<Navigate to="/login" replace />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Counter Portal Routes (COUNTER + ADMIN) */}
        <Route
          path="/counter"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'COUNTER']}>
              <CounterLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/counter/new-sale" replace />} />
          <Route path="new-sale" element={<NewSale />} />
          <Route path="today-sales" element={<TodaySales />} />
          <Route path="stock-lookup" element={<StockAvailability />} />
        </Route>

        {/* Admin Portal Routes (ADMIN ONLY) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="tyres" element={<Tyres />} />
          <Route path="accessories" element={<Accessories />} />
          <Route path="stock-in" element={<StockIn />} />
          <Route path="stock-adjust" element={<StockAdjust />} />
          <Route path="stock-ledger" element={<StockLedger />} />
          <Route path="sales" element={<SalesLedger />} />
          <Route path="finance" element={<Finance />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
