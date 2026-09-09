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
            background: '#1e2538',
            color: '#e8eaed',
            border: '1px solid #2a3344',
          },
        }}
      />
    </div>
  );
};

export default Layout;
