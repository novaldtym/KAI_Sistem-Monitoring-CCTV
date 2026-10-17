import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummaryApi } from '../services/api';
import { FiCheckCircle, FiPlusCircle } from 'react-icons/fi';
import StationInspectionMap from '../components/StationInspectionMap';
import { REVIEW_ROLES } from '../constants/roles';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummaryApi()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const counts = data?.counts || { draft: 0, submitted: 0, approved: 0, rejected: 0, total: 0 };

  if (user?.role === 'admin') {
    return <div>
      <div className="page-header">
        <h1 className="page-title">Administrasi Monitoring CCTV</h1>
        <p className="page-subtitle">Kelola data stasiun, kelompok CCTV, dan akun pengguna.</p>
      </div>
      {data?.inventory ? <div className="stats-grid">
        {[
          ['Stasiun aktif', data.inventory.stations], ['Kelompok CCTV aktif', data.inventory.groups],
          ['Kamera aktif', data.inventory.cameras], ['Akun pengguna', data.inventory.users],
        ].map(([label, value]) => <div className="stat-card" key={label}><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>)}
      </div> : <p role="alert">Ringkasan belum berhasil dimuat. Refresh halaman untuk mencoba kembali.</p>}
      <div className="toolbar" style={{ marginTop: '24px', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        <Link to="/master/stations" className="btn btn-primary">Kelola Stasiun & Impor Excel</Link>
        <Link to="/master/cctv" className="btn btn-secondary">Kelola Titik CCTV</Link>
        <Link to="/master/users" className="btn btn-secondary">Kelola User</Link>
      </div>
    </div>;
  }

  return (
    <div className="fade-in dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Sistem Form Monitoring CCTV PT KAI</h1>
        <p className="page-subtitle">
          PT Kereta Api Indonesia (Persero)
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Draft</div>
          <div className="stat-value">{counts.draft}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Menunggu Review</div>
          <div className="stat-value">{counts.submitted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value">{counts.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ditolak</div>
          <div className="stat-value">{counts.rejected}</div>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: '32px' }}>
        <div className="dashboard-actions">
          {user?.role === 'petugas' && (
            <Link to="/reports/new" className="btn btn-primary">
              <FiPlusCircle /> Buat Laporan Baru
            </Link>
          )}
          <Link to="/reports" className="btn btn-secondary">
            Lihat Semua Laporan
          </Link>
          {REVIEW_ROLES.includes(user?.role) && (
            <Link to="/review" className="btn btn-primary">
              <FiCheckCircle /> Review Laporan ({counts.submitted})
            </Link>
          )}
        </div>
      </div>

      <StationInspectionMap />
    </div>
  );
};

export default DashboardPage;
