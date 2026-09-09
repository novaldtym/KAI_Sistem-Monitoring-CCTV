import React, { useEffect, useState } from 'react';
import { getReportsApi, approveReportApi, rejectReportApi } from '../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiEye, FiCheck, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const ReviewApprovalPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject'
  const [komentar, setKomentar] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const fetchPendingReports = () => {
    setLoading(true);
    getReportsApi({ status: 'submitted' })
      .then((res) => setReports(res.data.data))
      .catch(() => toast.error('Gagal memuat daftar review.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const handleAction = async () => {
    if (modalType === 'reject' && !komentar.trim()) {
      toast.error('Alasan penolakan (komentar) wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === 'approve') {
        await approveReportApi(selectedReport.id, komentar);
        toast.success('Laporan berhasil di-approve!');
      } else {
        await rejectReportApi(selectedReport.id, komentar);
        toast.success('Laporan berhasil di-reject.');
      }
      setModalType(null);
      setSelectedReport(null);
      setKomentar('');
      fetchPendingReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses tindakan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Review & Approval Laporan</h1>
        <p className="page-subtitle">Pemeriksaan dan persetujuan laporan monitoring CCTV dari Petugas</p>
      </div>

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
                <th>Tanggal Submit</th>
                <th style={{ textAlign: 'center' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '600' }}>{r.no_ref || '-'}</td>
                  <td>{r.station?.nama_stasiun}</td>
                  <td>{MONTHS[r.bulan - 1]} {r.tahun}</td>
                  <td>{r.createdBy?.nama} (NIPP: {r.createdBy?.nipp})</td>
                  <td>{new Date(r.updated_at).toLocaleDateString('id-ID')}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Link to={`/reports/${r.id}`} className="btn btn-secondary btn-sm" title="Periksa Detail">
                        <FiEye /> Periksa
                      </Link>
                      <button
                        onClick={() => { setSelectedReport(r); setModalType('approve'); }}
                        className="btn btn-success btn-sm"
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        onClick={() => { setSelectedReport(r); setModalType('reject'); }}
                        className="btn btn-danger btn-sm"
                      >
                        <FiX /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state">
          <p>Tidak ada laporan yang menunggu approval saat ini.</p>
        </div>
      )}

      {/* APPROVAL / REJECTION MODAL */}
      {modalType && selectedReport && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">
              {modalType === 'approve' ? 'Approve Laporan Monitoring' : 'Reject (Tolak) Laporan Monitoring'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Stasiun: <strong>{selectedReport.station?.nama_stasiun}</strong> | Periode: {MONTHS[selectedReport.bulan - 1]} {selectedReport.tahun}
            </p>

            <div className="form-group">
              <label className="form-label">
                {modalType === 'approve' ? 'Catatan / Komentar Approval (Opsional)' : 'Alasan Penolakan (Wajib)'}
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder={modalType === 'approve' ? 'Catatan tambahan...' : 'Jelaskan bagian yang perlu diperbaiki oleh petugas...'}
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
              ></textarea>
            </div>

            <div className="modal-actions">
              <button onClick={() => setModalType(null)} className="btn btn-secondary" disabled={submitting}>
                Batal
              </button>
              <button
                onClick={handleAction}
                className={`btn ${modalType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                disabled={submitting}
              >
                {submitting ? 'Memproses...' : modalType === 'approve' ? 'Konfirmasi Approve' : 'Konfirmasi Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewApprovalPage;
