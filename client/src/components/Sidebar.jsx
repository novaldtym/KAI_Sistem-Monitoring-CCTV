import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPendingCountApi } from '../services/api';
import { REPORT_ROLES, REVIEW_ROLES, ROLE_LABELS } from '../constants/roles';
import {
  FiGrid,
  FiFileText,
  FiPlusCircle,
  FiCheckSquare,
  FiVideo,
  FiMapPin,
  FiLogOut,
  FiUsers,
  FiKey,
  FiX,
} from 'react-icons/fi';

const Sidebar = ({ isMobile, isOpen, navigationRef, onNavigate, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const isReportsActive =
    location.pathname === '/reports' ||
    (location.pathname.startsWith('/reports/') &&
      location.pathname !== '/reports/new' &&
      !location.pathname.endsWith('/edit'));

  const isInputMonitoringActive =
    location.pathname === '/reports/new' ||
    location.pathname.endsWith('/edit');

  useEffect(() => {
    if (!user || !REVIEW_ROLES.includes(user.role)) return;

    const refreshCount = () => {
      getPendingCountApi()
        .then((res) => setPendingCount(res.data.data.pendingCount))
        .catch(() => {});
    };

    refreshCount();
    window.addEventListener('reports-updated', refreshCount);
    return () => {
      window.removeEventListener('reports-updated', refreshCount);
    };
  }, [user, location.pathname]);

  const handleLogout = () => {
    onNavigate();
    logout();
    navigate('/login');
  };

  return (
    <aside id="main-navigation" ref={navigationRef} className={`sidebar${isOpen ? ' is-open' : ''}`}
      role={isMobile ? 'dialog' : undefined} aria-modal={isOpen ? true : undefined} aria-label="Menu navigasi"
      inert={isMobile && !isOpen ? true : undefined}>
      <div className="sidebar-header">
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Tutup menu navigasi"><FiX aria-hidden="true" /></button>
        <img src="/logo-kai.webp" alt="PT Kereta Api Indonesia" className="sidebar-logo-img" />
        <div className="sidebar-logo-sub">MONITORING CCTV</div>
      </div>

      <nav className="sidebar-nav" onClick={(event) => { if (event.target.closest('a')) onNavigate(); }}>
        <div className="nav-section-title">Menu Utama</div>
        
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="icon"><FiGrid /></span>
          Dashboard
        </NavLink>

        {REPORT_ROLES.includes(user?.role) && <NavLink
          to="/reports"
          end
          className={() => `nav-link ${isReportsActive ? 'active' : ''}`}
        >
          <span className="icon"><FiFileText /></span>
          Daftar Laporan
        </NavLink>}

        {user?.role === 'petugas' && (
          <NavLink
            to="/reports/new"
            className={() => `nav-link ${isInputMonitoringActive ? 'active' : ''}`}
          >
            <span className="icon"><FiPlusCircle /></span>
            Input Monitoring
          </NavLink>
        )}

        {REVIEW_ROLES.includes(user?.role) && (
          <NavLink to="/review" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="icon"><FiCheckSquare /></span>
            Review & Approval
            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </NavLink>
        )}

        {user?.role === 'admin' && (
          <>
            <div className="nav-section-title">Master Data</div>
            
            <NavLink to="/master/cctv" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon"><FiVideo /></span>
              Titik CCTV
            </NavLink>

            <NavLink to="/master/stations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon"><FiMapPin /></span>
              Stasiun
            </NavLink>
            <NavLink to="/master/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon"><FiUsers /></span>
              Kelola User
            </NavLink>
          </>
        )}
        <div className="nav-section-title">Akun</div>
        <NavLink to="/account/password" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="icon"><FiKey /></span>
          Ganti Password
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="user-name">{user?.nama}</div>
            <div className="user-role">
              {ROLE_LABELS[user?.role] || '-'} ({user?.nipp})
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
