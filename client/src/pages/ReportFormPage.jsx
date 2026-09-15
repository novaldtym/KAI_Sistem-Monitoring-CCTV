import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getStationsApi,
  getCCTVPointsByStationApi,
  createReportApi,
  updateReportApi,
  getReportByIdApi,
  submitReportApi,
} from "../services/api";
import StatusToggle from "../components/StatusToggle";
import toast from "react-hot-toast";
import { FiSave, FiSend, FiArrowLeft, FiCheck } from "react-icons/fi";

const ReportFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [noRef, setNoRef] = useState("001/01/" + new Date().getFullYear());
  const [catatan, setCatatan] = useState("");

  const [tanggalM1, setTanggalM1] = useState("");
  const [tanggalM2, setTanggalM2] = useState("");
  const [tanggalM3, setTanggalM3] = useState("");
  const [tanggalM4, setTanggalM4] = useState("");

  const [cctvPoints, setCctvPoints] = useState([]);
  const [detailsMap, setDetailsMap] = useState({}); // { [cctvPointId]: { m1_berfungsi, m1_terbackup, ... } }
  const [reportStatus, setReportStatus] = useState("draft");

  const [checkedAtM1, setCheckedAtM1] = useState(null);
  const [checkedAtM2, setCheckedAtM2] = useState(null);
  const [checkedAtM3, setCheckedAtM3] = useState(null);
  const [checkedAtM4, setCheckedAtM4] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Fetch stations on load
  useEffect(() => {
    getStationsApi().then((res) => setStations(res.data.data));
  }, []);

  // Recalculate M1-M4 dates when bulan/tahun changes
  useEffect(() => {
    if (selectedStation && bulan && tahun && stations.length > 0) {
      calcM1M4Dates(selectedStation, bulan, tahun);
    }
  }, [bulan, tahun, stations]);

  // Fetch report data if editing
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getReportByIdApi(id)
        .then((res) => {
          const r = res.data.data;
          setSelectedStation(r.station_id);
          setBulan(r.bulan);
          setTahun(r.tahun);
          setNoRef(r.no_ref || "");
          setCatatan(r.catatan || "");
          setReportStatus(r.status);
          setCheckedAtM1(r.checked_at_m1 || null);
          setCheckedAtM2(r.checked_at_m2 || null);
          setCheckedAtM3(r.checked_at_m3 || null);
          setCheckedAtM4(r.checked_at_m4 || null);

          const map = {};
          (r.details || []).forEach((d) => {
            map[d.cctv_point_id] = {
              m1_berfungsi: d.m1_berfungsi,
              m1_terbackup: d.m1_terbackup,
              m2_berfungsi: d.m2_berfungsi,
              m2_terbackup: d.m2_terbackup,
              m3_berfungsi: d.m3_berfungsi,
              m3_terbackup: d.m3_terbackup,
              m4_berfungsi: d.m4_berfungsi,
              m4_terbackup: d.m4_terbackup,
            };
          });
          setDetailsMap(map);

          // Fetch points for this station
          return getCCTVPointsByStationApi(r.station_id);
        })
        .then((res) => {
          if (res) setCctvPoints(res.data.data);
        })
        .catch(() => toast.error("Gagal memuat data laporan."))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const calcM1M4Dates = (stationId, bln, thn) => {
    const station = stations.find((s) => s.id === parseInt(stationId));
    if (!station || !station.hari_mulai_m1 || !bln || !thn) return;
    const day = station.hari_mulai_m1;
    const m1 = new Date(parseInt(thn), parseInt(bln) - 1, day);
    const fmt = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setTanggalM1(fmt(m1));
    setTanggalM2(fmt(new Date(m1.getTime() + 7 * 86400000)));
    setTanggalM3(fmt(new Date(m1.getTime() + 14 * 86400000)));
    setTanggalM4(fmt(new Date(m1.getTime() + 21 * 86400000)));
  };

  // Load CCTV points when station changes in create mode
  const handleStationChange = async (stationId) => {
    setSelectedStation(stationId);
    if (!stationId) {
      setCctvPoints([]);
      setDetailsMap({});
      setTanggalM1("");
      setTanggalM2("");
      setTanggalM3("");
      setTanggalM4("");
      return;
    }

    calcM1M4Dates(stationId, bulan, tahun);

    try {
      const res = await getCCTVPointsByStationApi(stationId);
      const points = res.data.data;
      setCctvPoints(points);

      const map = {};
      points.forEach((p) => {
        map[p.id] = {
          m1_berfungsi: "-",
          m1_terbackup: "-",
          m2_berfungsi: "-",
          m2_terbackup: "-",
          m3_berfungsi: "-",
          m3_terbackup: "-",
          m4_berfungsi: "-",
          m4_terbackup: "-",
        };
      });
      setDetailsMap(map);
    } catch {
      toast.error("Gagal memuat titik CCTV.");
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parseDate = (s) => s ? new Date(s + 'T00:00:00') : null;
  const m1Locked = tanggalM2 ? today >= parseDate(tanggalM2) : false;
  const m2Locked = tanggalM3 ? today >= parseDate(tanggalM3) : false;
  const m3Locked = tanggalM4 ? today >= parseDate(tanggalM4) : false;
  const m4End = tanggalM4 ? new Date(parseDate(tanggalM4).getTime() + 7 * 86400000) : null;
  const m4Locked = m4End ? today >= m4End : false;

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Toggle cell status
  const handleToggle = (pointId, field, newVal) => {
    setDetailsMap((prev) => ({
      ...prev,
      [pointId]: {
        ...prev[pointId],
        [field]: newVal,
      },
    }));

    if (field.startsWith('m1_')) setCheckedAtM1(todayStr);
    else if (field.startsWith('m2_')) setCheckedAtM2(todayStr);
    else if (field.startsWith('m3_')) setCheckedAtM3(todayStr);
    else if (field.startsWith('m4_')) setCheckedAtM4(todayStr);
  };

  // Helper to build payload
  const buildPayload = () => {
    const details = Object.keys(detailsMap).map((pointId) => ({
      cctv_point_id: parseInt(pointId),
      ...detailsMap[pointId],
    }));

    return {
      station_id: parseInt(selectedStation),
      bulan: parseInt(bulan),
      tahun: parseInt(tahun),
      no_ref: noRef,
      tanggal_m1: tanggalM1 || null,
      tanggal_m2: tanggalM2 || null,
      tanggal_m3: tanggalM3 || null,
      tanggal_m4: tanggalM4 || null,
      checked_at_m1: checkedAtM1 || null,
      checked_at_m2: checkedAtM2 || null,
      checked_at_m3: checkedAtM3 || null,
      checked_at_m4: checkedAtM4 || null,
      catatan,
      details,
    };
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!selectedStation) {
      toast.error("Pilih Stasiun terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await updateReportApi(id, payload);
        toast.success("Draft berhasil diperbarui.");
      } else {
        const res = await createReportApi(payload);
        toast.success("Draft berhasil disimpan.");
        navigate(`/reports/${res.data.data.id}/edit`, { replace: true });
      }
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan draft.");
    } finally {
      setSaving(false);
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!selectedStation) {
      toast.error("Pilih Stasiun terlebih dahulu.");
      return;
    }

    if (
      !window.confirm(
        "Apakah Anda yakin ingin mengirim laporan ini untuk di-review? Data tidak bisa diubah setelah di-submit.",
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      let targetId = id;

      if (isEdit) {
        await updateReportApi(id, payload);
      } else {
        const res = await createReportApi(payload);
        targetId = res.data.data.id;
      }

      await submitReportApi(targetId);
      toast.success("Laporan berhasil dikirim untuk review!");
      navigate("/reports");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim laporan.");
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <button
            onClick={() => navigate("/reports")}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: "8px" }}
          >
            <FiArrowLeft /> Kembali
          </button>
          <h1 className="page-title">
            {isEdit
              ? "Edit Form Monitoring CCTV"
              : "Input Form Monitoring CCTV"}
          </h1>
          <p className="page-subtitle">
            Isi data pemeriksaan CCTV mingguan (M1-M4)
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {lastSaved && (
            <span
              style={{
                fontSize: "12px",
                color: "var(--status-success)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiCheck /> Draft tersimpan {lastSaved}
            </span>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="btn btn-secondary"
          >
            <FiSave /> {saving ? "Menyimpan..." : "Simpan Draft"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary"
          >
            <FiSend /> Submit untuk Review
          </button>
        </div>
      </div>

      {/* HEADER METADATA FORM */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3
          style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}
        >
          Informasi Periode & Stasiun
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Stasiun</label>
            <select
              className="form-control"
              value={selectedStation}
              onChange={(e) => handleStationChange(e.target.value)}
              disabled={isEdit}
            >
              <option value="">-- Pilih Stasiun --</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nama_stasiun} ({st.business_area})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Bulan</label>
            <select
              className="form-control"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              disabled={isEdit}
            >
              {MONTHS.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tahun</label>
            <input
              type="number"
              className="form-control"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              disabled={isEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">No. Ref</label>
            <input
              type="text"
              className="form-control"
              value={noRef}
              onChange={(e) => setNoRef(e.target.value)}
            />
          </div>
        </div>

        {/* TANGGAL PELAKSANAAN MINGGUAN */}
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            margin: "16px 0 12px",
            color: "var(--text-secondary)",
          }}
        >
          Tanggal Pelaksanaan Mingguan
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tgl M1</label>
            <input
              type="date"
              className="form-control"
              value={tanggalM1}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tgl M2</label>
            <input
              type="date"
              className="form-control"
              value={tanggalM2}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tgl M3</label>
            <input
              type="date"
              className="form-control"
              value={tanggalM3}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tgl M4</label>
            <input
              type="date"
              className="form-control"
              value={tanggalM4}
              disabled
            />
          </div>
        </div>
      </div>

      {/* MONITORING INTERACTIVE TABLE */}
      {cctvPoints.length > 0 ? (
        <div
          className="table-container monitoring-grid"
          style={{ marginBottom: "24px" }}
        >
          <table>
            <thead>
              <tr>
                <th rowSpan="3" style={{ width: "40px" }}>
                  No
                </th>
                <th rowSpan="3" className="col-nama">
                  Nama Titik CCTV
                </th>
                <th colSpan="2">M1 {tanggalM1 && `(${tanggalM1})`}</th>
                <th colSpan="2">M2 {tanggalM2 && `(${tanggalM2})`}</th>
                <th colSpan="2">M3 {tanggalM3 && `(${tanggalM3})`}</th>
                <th colSpan="2">M4 {tanggalM4 && `(${tanggalM4})`}</th>
              </tr>
              <tr>
                <th colSpan="2" style={{ fontSize: '10px', fontWeight: '400', color: checkedAtM1 ? 'var(--status-success)' : 'var(--text-muted)', padding: '2px 4px' }}>
                  {checkedAtM1 ? `Diperiksa: ${checkedAtM1}` : 'Belum diperiksa'}
                </th>
                <th colSpan="2" style={{ fontSize: '10px', fontWeight: '400', color: checkedAtM2 ? 'var(--status-success)' : 'var(--text-muted)', padding: '2px 4px' }}>
                  {checkedAtM2 ? `Diperiksa: ${checkedAtM2}` : 'Belum diperiksa'}
                </th>
                <th colSpan="2" style={{ fontSize: '10px', fontWeight: '400', color: checkedAtM3 ? 'var(--status-success)' : 'var(--text-muted)', padding: '2px 4px' }}>
                  {checkedAtM3 ? `Diperiksa: ${checkedAtM3}` : 'Belum diperiksa'}
                </th>
                <th colSpan="2" style={{ fontSize: '10px', fontWeight: '400', color: checkedAtM4 ? 'var(--status-success)' : 'var(--text-muted)', padding: '2px 4px' }}>
                  {checkedAtM4 ? `Diperiksa: ${checkedAtM4}` : 'Belum diperiksa'}
                </th>
              </tr>
              <tr>
                <th style={{ width: "70px" }}>Berfungsi</th>
                <th style={{ width: "70px" }}>Terbackup</th>
                <th style={{ width: "70px" }}>Berfungsi</th>
                <th style={{ width: "70px" }}>Terbackup</th>
                <th style={{ width: "70px" }}>Berfungsi</th>
                <th style={{ width: "70px" }}>Terbackup</th>
                <th style={{ width: "70px" }}>Berfungsi</th>
                <th style={{ width: "70px" }}>Terbackup</th>
              </tr>
            </thead>
            <tbody>
              {cctvPoints.map((point) => {
                const detail = detailsMap[point.id] || {};
                return (
                  <tr key={point.id}>
                    <td style={{ fontWeight: "700" }}>{point.nomor_urut}</td>
                    <td className="col-nama">{point.nama_titik}</td>

                    <td>
                      <StatusToggle
                        value={detail.m1_berfungsi || "-"}
                        onChange={(val) =>
                          handleToggle(point.id, "m1_berfungsi", val)
                        }
                        disabled={m1Locked}
                      />
                    </td>
                    <td>
                      <StatusToggle
                        value={detail.m1_terbackup || "-"}
                        onChange={(val) =>
                          handleToggle(point.id, "m1_terbackup", val)
                        }
                        disabled={m1Locked}
                      />
                    </td>

                    <td>
                      <StatusToggle
                        value={detail.m2_berfungsi || "-"}
                        onChange={(val) =>
                          handleToggle(point.id, "m2_berfungsi", val)
                        }
                        disabled={m2Locked}
                      />
                    </td>
                    <td>
                      <StatusToggle
                        value={detail.m2_terbackup || "-"}
                        onChange={(val) =>
                          handleToggle(point.id, "m2_terbackup", val)
                        }
                        disabled={m2Locked}
                      />
                    </td>

                    <td>
                      <StatusToggle
                        value={detail.m3_berfungsi || "-"}
                        onChange={(val) =>
                          handleToggle(point.id, "m3_berfungsi", val)
                        }
                        disabled={m3Locked}
                      />
                    </td>
                    <td>
                      <StatusToggle
                        value={detail.m3_terbackup || "-"}
                        onChange={(val) =>
                          handleToggle(point.id, "m3_terbackup", val)
                        }
                        disabled={m3Locked}
                      />
                    </td>

                    <td>
                      <StatusToggle
                        value={detail.m4_berfungsi || "-"}
                        onChange={(val) =>
                          handleToggle(point.id, "m4_berfungsi", val)
                        }
                        disabled={m4Locked}
                      />
                    </td>
                    <td>
                      <StatusToggle
                        value={detail.m4_terbackup || "-"}
                        onChange={(val) =>
                          handleToggle(point.id, "m4_terbackup", val)
                        }
                        disabled={m4Locked}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state">
          <p>Pilih Stasiun di atas untuk menampilkan daftar titik CCTV.</p>
        </div>
      )}

      {/* CATATAN */}
      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Catatan Tambahan</label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="Masukkan catatan jika ada kendala titik CCTV..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default ReportFormPage;
