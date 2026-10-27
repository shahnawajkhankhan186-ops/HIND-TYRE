import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  // Desktop sidebar state (default: open on desktop >= 992px)
  const [desktopOpen, setDesktopOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_sidebar_open');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 992;
    }
    return true;
  });

  // Mobile drawer state (< 992px)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer automatically when resizing to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 992) {
        setMobileOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Universal 3-lines toggle handler
  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 992) {
      setDesktopOpen((prev) => {
        const next = !prev;
        localStorage.setItem('admin_sidebar_open', String(next));
        return next;
      });
    } else {
      setMobileOpen((prev) => !prev);
    }
  };

  const isSidebarOpen = typeof window !== 'undefined' && window.innerWidth >= 992 ? desktopOpen : mobileOpen;

  return (
    <div className="admin-app-root">
      <header className="admin-navbar-fixed">
        <Navbar onToggleSidebar={handleToggleSidebar} isSidebarOpen={isSidebarOpen} />
      </header>
      <div className="admin-body-container">
        <Sidebar
          desktopOpen={desktopOpen}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleDesktop={handleToggleSidebar}
        />
        <main className="admin-main-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
