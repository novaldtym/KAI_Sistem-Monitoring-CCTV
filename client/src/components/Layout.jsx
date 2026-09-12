import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.1)',
            fontWeight: 500,
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
};

export default Layout;
