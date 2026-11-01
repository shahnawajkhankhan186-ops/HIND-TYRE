import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';

// Layouts (direct or lazy)
import AdminLayout from './components/layout/AdminLayout';
import CounterLayout from './components/layout/CounterLayout';

// Public Landing Page (Eagerly imported for instant 0ms first-contentful paint)
import Landing from './pages/public/Landing';

// Lazy-loaded Pages (Code-split to keep initial bundle tiny & lightning fast)
const NotFound = lazy(() => import('./pages/public/NotFound'));
const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// Counter Portal Pages (Lazy)
const NewSale = lazy(() => import('./pages/counter/NewSale'));
const TodaySales = lazy(() => import('./pages/counter/TodaySales'));
const StockAvailability = lazy(() => import('./pages/counter/StockAvailability'));

// Admin Portal Pages (Lazy)
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Companies = lazy(() => import('./pages/admin/Companies'));
const Tyres = lazy(() => import('./pages/admin/Tyres'));
const Accessories = lazy(() => import('./pages/admin/Accessories'));
const StockIn = lazy(() => import('./pages/admin/StockIn'));
const StockAdjust = lazy(() => import('./pages/admin/StockAdjust'));
const StockLedger = lazy(() => import('./pages/admin/StockLedger'));
const SalesLedger = lazy(() => import('./pages/admin/SalesLedger'));
const Finance = lazy(() => import('./pages/admin/Finance'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Users = lazy(() => import('./pages/admin/Users'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

// Lightweight non-blocking route fallback spinner
function PageLoader() {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: '#0A0A0C' }}
    >
      <div className="spinner-border text-warning" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

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

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Showcase & Landing - Renders immediately with zero delay */}
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
          <Route path="/register" element={<Navigate to="/login" replace />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
