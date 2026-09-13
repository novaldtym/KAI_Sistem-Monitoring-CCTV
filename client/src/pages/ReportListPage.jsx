import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReportsApi, getStationsApi, getOfficersApi, downloadReportPdfApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiEye, FiEdit, FiDownload, FiFilter, FiRefreshCw } from 'react-icons/fi';

const ReportListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [stations, setStations] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  useEffect(() => {
    getStationsApi().then((res) => setStations(res.data.data));
    if (user?.role === 'assistant_manager') {
      getOfficersApi().then((res) => setOfficers(res.data.data || [])).catch(() => {});
    }
  }, [user]);

  const fetchReports = () => {
    setLoading(true);
    getReportsApi({
      station_id: selectedStation || undefined,
      created_by: selectedOfficer || undefined,
      bulan: bulan || undefined,
      tahun: tahun || undefined,
      status: status || undefined,
      page,
      limit: 10,
    })
      .then((res) => {
        setReports(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Gagal memuat laporan.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStation, selectedOfficer, bulan, tahun, status, page]);

  const handleDownloadPdf = async (report) => {
    const toastId = toast.loading('Generating PDF...');
    try {
      const res = await downloadReportPdfApi(report.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Monitoring_CCTV_${report.station?.nama_stasiun || 'Stasiun'}_${report.bulan}_${report.tahun}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success('PDF berhasil di-download!', { id: toastId });
    } catch {
      toast.error('Gagal mengunduh PDF.', { id: toastId });
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'draft': return <span className="badge badge-draft">Draft</span>;
      case 'submitted': return <span className="badge badge-submitted">Menunggu Review</span>;
      case 'approved': return <span className="badge badge-approved">Approved</span>;
      case 'rejected': return <span className="badge badge-rejected">Ditolak</span>;
      default: return <span className="badge">{st}</span>;
    }
  };

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Daftar Laporan Monitoring CCTV</h1>
          <p className="page-subtitle">Kelola dan lihat seluruh laporan monitoring mingguan</p>
        </div>
        {user?.role === 'petugas' && (
          <Link to="/reports/new" className="btn btn-primary">
            <FiPlus /> Input Monitoring Baru
          </Link>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="card filter-bar">
        <div className="form-group">
          <label className="form-label">Stasiun</label>
          <select className="form-control" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
            <option value="">Semua Stasiun</option>
            {stations.map((st) => (
              <option key={st.id} value={st.id}>{st.nama_stasiun}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Bulan</label>
          <select className="form-control" value={bulan} onChange={(e) => setBulan(e.target.value)}>
            <option value="">Semua Bulan</option>
            {MONTHS.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tahun</label>
          <input
            type="number"
            className="form-control"
            placeholder="Tahun"
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-control" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {user?.role === 'assistant_manager' && (
          <div className="form-group">
            <label className="form-label">Petugas Input</label>
            <select
              className="form-control"
              value={selectedOfficer}
              onChange={(e) => { setSelectedOfficer(e.target.value); setPage(1); }}
            >
              <option value="">Semua Petugas</option>
              {officers.map((off) => (
                <option key={off.id} value={off.id}>{off.nama} ({off.nipp})</option>
              ))}
            </select>
          </div>
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setSelectedStation(''); setSelectedOfficer(''); setBulan(''); setTahun(''); setStatus(''); setPage(1);
          }}
        >
          <FiRefreshCw /> Reset
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : reports.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Ref</th>
                <th>Stasiun</th>
                <th>Periode</th>
                <th>Petugas Input</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '600' }}>{r.no_ref || '-'}</td>
                  <td>{r.station?.nama_stasiun}</td>
                  <td>{MONTHS[r.bulan - 1]} {r.tahun}</td>
                  <td>{r.createdBy?.nama || '-'}</td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Link to={`/reports/${r.id}`} className="btn btn-secondary btn-sm btn-icon" title="Lihat Detail">
                        <FiEye />
                      </Link>

                      {(r.status === 'draft' || r.status === 'rejected') && user?.role === 'petugas' && (
                        <Link to={`/reports/${r.id}/edit`} className="btn btn-secondary btn-sm btn-icon" title="Edit">
                          <FiEdit />
                        </Link>
                      )}

                      {r.status === 'approved' && (
                        <button
                          onClick={() => handleDownloadPdf(r)}
                          className="btn btn-primary btn-sm btn-icon"
                          title="Download PDF Formal"
                        >
                          <FiDownload />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="pagination">
            <div>Menampilkan {reports.length} dari {pagination.total} laporan</div>
            <div className="pagination-btns">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </button>
              <span style={{ padding: '6px 12px', fontSize: '12px' }}>
                Halaman {page} dari {pagination.totalPages || 1}
              </span>
              <button
                className="pagination-btn"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card empty-state">
          <p>Belum ada laporan monitoring yang ditemukan.</p>
        </div>
      )}
    </div>
  );
};

export default ReportListPage;
