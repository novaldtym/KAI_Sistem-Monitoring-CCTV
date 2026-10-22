import React, { Fragment, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getReportByIdApi,
  downloadReportPdfApi,
  approveReportApi,
  rejectReportApi,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiArrowLeft, FiDownload, FiEdit, FiCheck, FiX } from "react-icons/fi";

import { pointLabel } from "../utils/reportPresentation";
import { REVIEW_ROLES } from "../constants/roles";
import MobileMonitoringList from "../components/MobileMonitoringList";

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Approval modal state
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject'
  const [komentar, setKomentar] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const MONTHS = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const fetchReport = () => {
    getReportByIdApi(id)
      .then((res) => setReport(res.data.data))
      .catch(() => toast.error("Gagal memuat detail laporan."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleDownloadPdf = async () => {
    const toastId = toast.loading("Generating PDF...");
    try {
      const res = await downloadReportPdfApi(report.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Monitoring_CCTV_${report.station?.nama_stasiun || "Stasiun"}_${report.bulan}_${report.tahun}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success("PDF berhasil di-download!", { id: toastId });
    } catch {
      toast.error("Gagal mengunduh PDF.", { id: toastId });
    }
  };

  const handleApprovalAction = async () => {
    if (modalType === "reject" && !komentar.trim()) {
      toast.error("Alasan penolakan (komentar) wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === "approve") {
        await approveReportApi(report.id, komentar);
        toast.success("Laporan berhasil di-approve!");
      } else {
        await rejectReportApi(report.id, komentar);
        toast.success("Laporan berhasil di-reject.");
      }
      window.dispatchEvent(new Event('reports-updated'));
      setModalType(null);
      setKomentar("");
      // Reload report to reflect new status
      setLoading(true);
      fetchReport();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memproses tindakan.");
    } finally {
      setSubmitting(false);
    }
  };

  const isManager = REVIEW_ROLES.includes(user?.role);
  const canApprove = isManager && report?.status === "submitted";

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card empty-state">
        <p>Laporan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="report-detail-header">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: "8px" }}
          >
            <FiArrowLeft /> Kembali
          </button>
          <h1 className="page-title">
            Detail Monitoring CCTV — {report.station?.nama_stasiun}
          </h1>
          <p className="page-subtitle">
            Periode: {MONTHS[report.bulan - 1]} {report.tahun} | Ref:{" "}
            {report.no_ref || "-"}
          </p>
        </div>

        <div className="toolbar-actions">
          {(report.status === "draft" || report.status === "rejected") &&
            user?.role === "petugas" && (
              <Link
                to={`/reports/${report.id}/edit`}
                className="btn btn-secondary"
              >
                <FiEdit /> Edit Laporan
              </Link>
            )}
          {report.status === "approved" && (
            <button onClick={handleDownloadPdf} className="btn btn-primary">
              <FiDownload /> Download PDF Formulir Presisi
            </button>
          )}
        </div>
      </div>

      {/* METADATA SUMMARY */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <div className="form-label">Petugas Pembuat</div>
            <div style={{ fontWeight: "600" }}>
              {report.createdBy?.nama} (NIPP: {report.createdBy?.nipp})
            </div>
          </div>
          <div>
            <div className="form-label">Status Laporan</div>
            <div
              style={{
                fontWeight: "700",
                textTransform: "uppercase",
                color:
                  report.status === "approved"
                    ? "var(--status-success)"
                    : report.status === "rejected"
                      ? "var(--status-danger)"
                      : "var(--status-warning)",
              }}
            >
              {report.status}
            </div>
          </div>
          <div>
            <div className="form-label">Pemeriksaan Mingguan</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {(report.calendar?.weeks || []).map((week) => (
                <div key={week.number}>
                  {week.label}: tanggal {week.range} · {week.completedGroups}/
                  {week.totalGroups} kelompok lengkap
                  {week.checkedAt ? ` · Terakhir diisi ${week.checkedAt}` : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MobileMonitoringList weeks={report.calendar?.weeks || []} station={report.station} readOnly
        points={(report.details || []).map((detail) => detail.cctvPoint).filter(Boolean)}
        valuesFor={(point) => report.details.find((detail) => detail.cctv_point_id === point.id) || {}} />
      <div
        className="table-container monitoring-grid desktop-monitoring"
        style={{ marginBottom: "24px" }}
      >
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>No</th>
              <th rowSpan={2} className="col-nama">
                Penempatan / Objek Pantau
              </th>
              {(report.calendar?.weeks || []).map((week) => (
                <th key={week.number} colSpan={2}>
                  {week.label} ({week.range})
                </th>
              ))}
            </tr>
            <tr>
              {(report.calendar?.weeks || []).map((week) => (
                <Fragment key={week.number}>
                  <th>Berfungsi</th>
                  <th>Terbackup</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {(report.details || []).map((detail) => (
              <tr key={detail.id}>
                <td>{detail.cctvPoint?.nomor_urut}</td>
                <td className="col-nama">
                  {pointLabel(detail.cctvPoint, report.station)}
                </td>
                {(report.calendar?.weeks || []).map((week) => (
                  <Fragment key={week.number}>
                    {["berfungsi", "terbackup"].map((kind) => {
                      const value = detail[`m${week.number}_${kind}`];
                      return (
                        <td
                          key={kind}
                          style={{
                            fontWeight: "bold",
                            color:
                              value === "V"
                                ? "var(--status-success)"
                                : value === "X"
                                  ? "var(--status-danger)"
                                  : "var(--text-muted)",
                          }}
                        >
                          {value === "V" ? "✓" : value === "X" ? "✗" : "-"}
                        </td>
                      );
                    })}
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CATATAN & APPROVAL HISTORY */}
      <div
        className="report-detail-sections"
        style={{
          marginBottom: canApprove ? "24px" : "0",
        }}
      >
        <div className="card">
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "700",
              marginBottom: "10px",
            }}
          >
            Catatan
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            {report.catatan || "Tidak ada catatan."}
          </p>
        </div>

        <div className="card">
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "700",
              marginBottom: "10px",
            }}
          >
            Riwayat Approval
          </h3>
          {(report.approvalLogs || []).length > 0 ? (
            report.approvalLogs.map((log) => (
              <div key={log.id}>
                <div style={{ fontWeight: "600", fontSize: "13px" }}>
                  {log.action === "approved" ? "Approved" : "Rejected"} oleh{" "}
                  {log.approver?.nama}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {new Date(log.approved_at).toLocaleString()}
                </div>
                {log.komentar && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      marginTop: "4px",
                    }}
                  >
                    "{log.komentar}"
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              Belum ada tindakan review.
            </p>
          )}
        </div>
      </div>

      {/* APPROVE / REJECT ACTIONS — bottom right, only for manager when status is submitted */}
      {canApprove && (
        <div className="report-approval-actions">
          <button
            onClick={() => {
              setModalType("approve");
              setKomentar("");
            }}
            className="btn btn-success"
          >
            <FiCheck /> Approve Laporan
          </button>
          <button
            onClick={() => {
              setModalType("reject");
              setKomentar("");
            }}
            className="btn btn-danger"
          >
            <FiX /> Reject Laporan
          </button>
        </div>
      )}

      {/* APPROVAL / REJECTION MODAL */}
      {modalType && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">
              {modalType === "approve"
                ? "Approve Laporan Monitoring"
                : "Reject (Tolak) Laporan Monitoring"}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              Stasiun: <strong>{report.station?.nama_stasiun}</strong> |
              Periode: {MONTHS[report.bulan - 1]} {report.tahun}
            </p>

            <div className="form-group">
              <label className="form-label">
                {modalType === "approve"
                  ? "Catatan / Komentar Approval (Opsional)"
                  : "Alasan Penolakan (Wajib)"}
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder={
                  modalType === "approve"
                    ? "Catatan tambahan..."
                    : "Jelaskan bagian yang perlu diperbaiki oleh petugas..."
                }
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
              ></textarea>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setModalType(null)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                onClick={handleApprovalAction}
                className={`btn ${modalType === "approve" ? "btn-success" : "btn-danger"}`}
                disabled={submitting}
              >
                {submitting
                  ? "Memproses..."
                  : modalType === "approve"
                    ? "Konfirmasi Approve"
                    : "Konfirmasi Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetailPage;
