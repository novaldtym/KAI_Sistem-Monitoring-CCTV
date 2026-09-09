import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPendingCountApi } from '../services/api';
import {
  FiGrid,
  FiFileText,
  FiPlusCircle,
  FiCheckSquare,
  FiVideo,
  FiMapPin,
  FiLogOut,
} from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user && user.role === 'assistant_manager') {
      getPendingCountApi()
        .then((res) => setPendingCount(res.data.data.pendingCount))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">KAI</div>
        <div className="sidebar-logo-sub">MONITORING CCTV</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Menu Utama</div>
        
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="icon"><FiGrid /></span>
          Dashboard
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="icon"><FiFileText /></span>
          Daftar Laporan
        </NavLink>

        {user?.role === 'petugas' && (
          <NavLink to="/reports/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="icon"><FiPlusCircle /></span>
            Input Monitoring
          </NavLink>
        )}

        {user?.role === 'assistant_manager' && (
          <NavLink to="/review" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="icon"><FiCheckSquare /></span>
            Review & Approval
            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </NavLink>
        )}

        {user?.role === 'assistant_manager' && (
          <>
            <div className="nav-section-title">Master Data</div>
            
            <NavLink to="/master/cctv" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon"><FiVideo /></span>
              Titik CCTV
            </NavLink>

            <NavLink to="/master/stations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon"><FiMapPin /></span>
              Stasiun & Area
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="user-name">{user?.nama}</div>
            <div className="user-role">
              {user?.role === 'assistant_manager' ? 'Assistant Manager' : 'Petugas'} ({user?.nipp})
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          <FiLogOut style={{ marginRight: '6px' }} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
