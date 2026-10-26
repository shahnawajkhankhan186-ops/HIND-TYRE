import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'var(--bg-light)' }}>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="d-flex flex-grow-1 position-relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-grow-1 overflow-x-hidden p-0" style={{ maxWidth: '100%', background: 'var(--bg-light)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
