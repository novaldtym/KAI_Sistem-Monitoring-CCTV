import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getReportByIdApi, downloadReportPdfApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiDownload, FiEdit, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  useEffect(() => {
    getReportByIdApi(id)
      .then((res) => setReport(res.data.data))
      .catch(() => toast.error('Gagal memuat detail laporan.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPdf = async () => {
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

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!report) {
    return <div className="card empty-state"><p>Laporan tidak ditemukan.</p></div>;
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/reports')} className="btn btn-secondary btn-sm" style={{ marginBottom: '8px' }}>
            <FiArrowLeft /> Kembali
          </button>
          <h1 className="page-title">Detail Monitoring CCTV — {report.station?.nama_stasiun}</h1>
          <p className="page-subtitle">Periode: {MONTHS[report.bulan - 1]} {report.tahun} | Ref: {report.no_ref || '-'}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {(report.status === 'draft' || report.status === 'rejected') && user?.role === 'petugas' && (
            <Link to={`/reports/${report.id}/edit`} className="btn btn-secondary">
              <FiEdit /> Edit Laporan
            </Link>
          )}
          {report.status === 'approved' && (
            <button onClick={handleDownloadPdf} className="btn btn-primary">
              <FiDownload /> Download PDF Formulir Presisi
            </button>
          )}
        </div>
      </div>

      {/* METADATA SUMMARY */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div>
            <div className="form-label">Business Area</div>
            <div style={{ fontWeight: '600' }}>{report.station?.business_area}</div>
          </div>
          <div>
            <div className="form-label">Petugas Pembuat</div>
            <div style={{ fontWeight: '600' }}>{report.createdBy?.nama} (NIPP: {report.createdBy?.nipp})</div>
          </div>
          <div>
            <div className="form-label">Status Laporan</div>
            <div style={{ fontWeight: '700', textTransform: 'uppercase', color: report.status === 'approved' ? 'var(--status-success)' : report.status === 'rejected' ? 'var(--status-danger)' : 'var(--status-warning)' }}>
              {report.status}
            </div>
          </div>
          <div>
            <div className="form-label">Tanggal Pelaksanaan</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              M1: {report.tanggal_m1 || '-'} | M2: {report.tanggal_m2 || '-'} | M3: {report.tanggal_m3 || '-'} | M4: {report.tanggal_m4 || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* MONITORING DETAILS TABLE */}
      <div className="table-container monitoring-grid" style={{ marginBottom: '24px' }}>
        <table>
          <thead>
            <tr>
              <th rowSpan="2">No</th>
              <th rowSpan="2" className="col-nama">Nama Titik CCTV</th>
              <th colSpan="2">M1</th>
              <th colSpan="2">M2</th>
              <th colSpan="2">M3</th>
              <th colSpan="2">M4</th>
            </tr>
            <tr>
              <th>Berfungsi</th>
              <th>Terbackup</th>
              <th>Berfungsi</th>
              <th>Terbackup</th>
              <th>Berfungsi</th>
              <th>Terbackup</th>
              <th>Berfungsi</th>
              <th>Terbackup</th>
            </tr>
          </thead>
          <tbody>
            {(report.details || []).map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: '700' }}>{d.cctvPoint?.nomor_urut}</td>
                <td className="col-nama">{d.cctvPoint?.nama_titik}</td>

                <td style={{ color: d.m1_berfungsi === 'V' ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 'bold' }}>
                  {d.m1_berfungsi === 'V' ? '✓' : d.m1_berfungsi === 'X' ? '✗' : '-'}
                </td>
                <td style={{ color: d.m1_terbackup === 'V' ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 'bold' }}>
                  {d.m1_terbackup === 'V' ? '✓' : d.m1_terbackup === 'X' ? '✗' : '-'}
                </td>

                <td style={{ color: d.m2_berfungsi === 'V' ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 'bold' }}>
                  {d.m2_berfungsi === 'V' ? '✓' : d.m2_berfungsi === 'X' ? '✗' : '-'}
                </td>
                <td style={{ color: d.m2_terbackup === 'V' ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 'bold' }}>
                  {d.m2_terbackup === 'V' ? '✓' : d.m2_terbackup === 'X' ? '✗' : '-'}
                </td>

                <td style={{ color: d.m3_berfungsi === 'V' ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 'bold' }}>
                  {d.m3_berfungsi === 'V' ? '✓' : d.m3_berfungsi === 'X' ? '✗' : '-'}
                </td>
                <td style={{ color: d.m3_terbackup === 'V' ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 'bold' }}>
                  {d.m3_terbackup === 'V' ? '✓' : d.m3_terbackup === 'X' ? '✗' : '-'}
                </td>

                <td style={{ color: d.m4_berfungsi === 'V' ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 'bold' }}>
                  {d.m4_berfungsi === 'V' ? '✓' : d.m4_berfungsi === 'X' ? '✗' : '-'}
                </td>
                <td style={{ color: d.m4_terbackup === 'V' ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 'bold' }}>
                  {d.m4_terbackup === 'V' ? '✓' : d.m4_terbackup === 'X' ? '✗' : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CATATAN & APPROVAL HISTORY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>Catatan</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {report.catatan || 'Tidak ada catatan.'}
          </p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>Riwayat Approval</h3>
          {(report.approvalLogs || []).length > 0 ? (
            report.approvalLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  borderLeft: `3px solid ${log.action === 'approved' ? 'var(--status-success)' : 'var(--status-danger)'}`,
                  paddingLeft: '12px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '13px' }}>
                  {log.action === 'approved' ? 'Approved' : 'Rejected'} oleh {log.approver?.nama}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(log.approved_at).toLocaleString()}
                </div>
                {log.komentar && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    "{log.komentar}"
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Belum ada tindakan review.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;
