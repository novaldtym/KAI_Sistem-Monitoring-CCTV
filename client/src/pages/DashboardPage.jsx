import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummaryApi } from '../services/api';
import { FiEdit3, FiClock, FiCheckCircle, FiXCircle, FiPlusCircle, FiAlertCircle } from 'react-icons/fi';

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
  const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Selamat Datang, {user?.nama}</h1>
        <p className="page-subtitle">
          Sistem Digitalisasi Monitoring CCTV PT KAI — Periode {MONTHS[data?.currentPeriod?.bulan]} {data?.currentPeriod?.tahun}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">{counts.draft}</div>
          <div className="stat-label">Draft</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-value">{counts.submitted}</div>
          <div className="stat-label">Menunggu Review</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{counts.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{counts.rejected}</div>
          <div className="stat-label">Ditolak</div>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {user?.role === 'petugas' && (
            <Link to="/reports/new" className="btn btn-primary">
              <FiPlusCircle /> Buat Laporan Baru
            </Link>
          )}
          <Link to="/reports" className="btn btn-secondary">
            Lihat Semua Laporan
          </Link>
          {user?.role === 'assistant_manager' && (
            <Link to="/review" className="btn btn-primary">
              <FiCheckCircle /> Review Laporan ({counts.submitted})
            </Link>
          )}
        </div>
      </div>

      {data?.unreportedStations && data.unreportedStations.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <FiAlertCircle style={{ color: 'var(--status-warning)', fontSize: '20px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Stasiun Belum Mengisi Bulan Ini</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.unreportedStations.map((st) => (
              <span
                key={st.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                }}
              >
                {st.nama_stasiun}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
