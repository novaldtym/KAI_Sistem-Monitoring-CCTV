import React, { useEffect, useState } from "react";
import { getReportsApi } from "../services/api";
import toast from "react-hot-toast";
import { FiEye } from "react-icons/fi";
import { Link } from "react-router-dom";

const formatSubmitDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });
};

const ReviewApprovalPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchPendingReports = () => {
    setLoading(true);
    getReportsApi({ status: "submitted" })
      .then((res) => setReports(res.data.data))
      .catch(() => toast.error("Gagal memuat daftar review."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Review & Approval Laporan</h1>
        <p className="page-subtitle">
          Pemeriksaan dan persetujuan laporan monitoring CCTV dari Petugas
        </p>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : reports.length > 0 ? (
        <div className="table-container mobile-card-container">
          <table className="data-table mobile-cards">
            <thead>
              <tr>
                <th>No. Ref</th>
                <th>Stasiun</th>
                <th>Periode</th>
                <th>Petugas Input</th>
                <th>Tanggal Submit</th>
                <th style={{ textAlign: "center" }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td data-label="No. Ref" style={{ fontWeight: "600" }}>{r.no_ref || "-"}</td>
                  <td data-label="Stasiun">{r.station?.nama_stasiun}</td>
                  <td data-label="Periode">
                    {MONTHS[r.bulan - 1]} {r.tahun}
                  </td>
                  <td data-label="Petugas">
                    {r.createdBy?.nama} (NIPP: {r.createdBy?.nipp})
                  </td>
                  <td data-label="Tanggal Submit">{formatSubmitDate(r.updatedAt)}</td>
                  <td data-label="Tindakan" style={{ textAlign: "center" }}>
                    <Link
                      to={`/reports/${r.id}`}
                      className="btn btn-secondary btn-sm"
                      title="Periksa Detail"
                    >
                      <FiEye /> Periksa
                    </Link>
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
    </div>
  );
};

export default ReviewApprovalPage;
