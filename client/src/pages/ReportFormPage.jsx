import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStationsApi, getCCTVPointsByStationApi, createReportApi, updateReportApi,
  getReportByIdApi, submitReportApi, getReportCalendarApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusToggle from '../components/StatusToggle';
import MobileMonitoringList from '../components/MobileMonitoringList';
import { MONTHS, emptyStatuses, statusValues, pointLabel, weekStateLabel } from '../utils/reportPresentation';
import toast from 'react-hot-toast';
import { FiSave, FiSend, FiArrowLeft } from 'react-icons/fi';
import './ReportFormPage.css';

function ReportForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [report, setReport] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [points, setPoints] = useState([]);
  const [detailsMap, setDetailsMap] = useState({});
  const [calendar, setCalendar] = useState(null);
  const [calendarError, setCalendarError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const stationRequest = useRef(0);
  const itemsPerPage = 20;

  useEffect(() => {
    let active = true;
    getStationsApi().then((response) => { if (active) setStations(response.data.data); })
      .catch(() => toast.error('Gagal memuat stasiun.'));
    return () => { active = false; };
  }, []);

  const applyReport = (data) => {
    setReport(data);
    setSelectedStation(String(data.station_id));
    setPeriod({ bulan: data.bulan, tahun: data.tahun });
    setCatatan(data.catatan || '');
    setPoints((data.details || []).map((detail) => detail.cctvPoint).filter(Boolean)
      .sort((a, b) => a.nomor_urut - b.nomor_urut));
    setDetailsMap(Object.fromEntries((data.details || []).map((detail) => [detail.cctv_point_id, statusValues(detail)])));
    if (data.calendar) setCalendar(data.calendar);
  };

  useEffect(() => {
    let active = true;
    if (isEdit) {
      getReportByIdApi(id).then((response) => { if (active) applyReport(response.data.data); })
        .catch((error) => { if (active) setLoadError(error.response?.data?.message || 'Gagal memuat laporan.'); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [id, isEdit]);

  useEffect(() => {
    let active = true;
    let latest = 0;
    const refresh = async () => {
      const request = ++latest;
      try {
        const response = await getReportCalendarApi(isEdit ? { report_id: id } : period || {});
        if (active && request === latest) {
          const data = response.data.data;
          setCalendar(data);
          if (!period) setPeriod({ bulan: data.bulan, tahun: data.tahun });
          setCalendarError('');
        }
      } catch (error) {
        if (active && request === latest) {
          setCalendar(null);
          setCalendarError(error.response?.data?.message || 'Jadwal belum dapat diperiksa. Coba muat ulang halaman.');
        }
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [period, id, isEdit]);

  const station = report?.station || stations.find((item) => String(item.id) === String(selectedStation));
  const matchingCalendar = calendar && period && calendar.bulan === Number(period.bulan) && calendar.tahun === Number(period.tahun) ? calendar : null;
  const weeks = matchingCalendar?.weeks || [];
  const canEdit = !isEdit || (report?.created_by === user?.id && ['draft', 'rejected'].includes(report?.status));
  const disabled = saving || loading || !canEdit || !matchingCalendar || !points.length;
  const totalPages = Math.max(1, Math.ceil(points.length / itemsPerPage));
  const visiblePoints = points.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const completed = (week) => points.filter((point) => ['V', 'X'].includes(detailsMap[point.id]?.[`m${week.number}_berfungsi`]) &&
    ['V', 'X'].includes(detailsMap[point.id]?.[`m${week.number}_terbackup`])).length;
  const isWeekLocked = (week) => !canEdit || !week.editable;
  const weekLockReason = (week) => !canEdit ? 'Laporan tidak dapat diedit.' :
    week.state === 'past' ? 'Minggu pemeriksaan sudah lewat.' : 'Minggu pemeriksaan belum dimulai.';

  const handleStationChange = async (value) => {
    const request = ++stationRequest.current;
    setSelectedStation(value);
    setPoints([]);
    setDetailsMap({});
    setCurrentPage(1);
    setLastSaved('');
    if (!value) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await getCCTVPointsByStationApi(value);
      if (request !== stationRequest.current) return;
      setPoints(response.data.data);
      setDetailsMap(Object.fromEntries(response.data.data.map((point) => [point.id, emptyStatuses()])));
    } catch {
      if (request === stationRequest.current) toast.error('Gagal memuat kelompok CCTV.');
    } finally {
      if (request === stationRequest.current) setLoading(false);
    }
  };
  const changePeriod = (field, value) => {
    setPeriod((previous) => ({ ...previous, [field]: value }));
    setCalendar(null);
    setLastSaved('');
    setDetailsMap(Object.fromEntries(points.map((point) => [point.id, emptyStatuses()])));
  };
  const toggle = (pointId, week, field, value) => {
    if (disabled || !week.editable) return;
    setDetailsMap((previous) => ({ ...previous, [pointId]: { ...previous[pointId], [field]: value } }));
    setLastSaved('');
  };
  const save = async (submit = false) => {
    if (disabled) return;
    if (submit && !window.confirm('Kirim laporan bulanan untuk review? Setelah dikirim, seluruh minggu tidak bisa diisi sampai laporan ditolak oleh reviewer.')) return;
    setSaving(true);
    let targetId = id;
    try {
      const payload = { station_id: Number(selectedStation), bulan: Number(period.bulan), tahun: Number(period.tahun),
        catatan, details: points.map((point) => ({ cctv_point_id: point.id, ...detailsMap[point.id] })) };
      if (isEdit) await updateReportApi(id, payload);
      else {
        const response = await createReportApi(payload);
        targetId = response.data.data.id;
        applyReport(response.data.data);
        navigate(`/reports/${targetId}/edit`, { replace: true });
      }
      if (submit) {
        await submitReportApi(targetId);
        window.dispatchEvent(new Event('reports-updated'));
        toast.success('Laporan berhasil dikirim untuk review.');
        navigate('/reports');
      } else {
        const response = await getReportByIdApi(targetId);
        applyReport(response.data.data);
        setLastSaved(new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }));
        toast.success('Draft berhasil disimpan.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan laporan.');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <div className="card" role="alert">{loadError}</div>;
  if (isEdit && !report && loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="fade-in report-form">
      <div className="toolbar">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reports')}><FiArrowLeft /> Kembali</button>
          <h1 className="page-title">{isEdit ? 'Edit' : 'Input'} Monitoring CCTV</h1>
          <p className="page-subtitle">Satu baris pemeriksaan untuk setiap kelompok lokasi CCTV.</p>
        </div>
      </div>
      {!canEdit && <p className="report-form-notice">Laporan ini terkunci karena sudah dikirim atau disetujui.</p>}
      <div className="card report-form-section">
        <h2>Periode dan Stasiun</h2>
        <div className="form-row">
          <div className="form-group"><label className="form-label" htmlFor="report-station">Stasiun</label>
            <select id="report-station" className="form-control" value={selectedStation} onChange={(event) => handleStationChange(event.target.value)} disabled={isEdit || saving}>
              <option value="">Pilih stasiun</option>
              {report?.station && !stations.some((item) => item.id === report.station_id) && <option value={report.station_id}>{report.station.nama_stasiun}</option>}
              {stations.map((item) => <option key={item.id} value={item.id}>{item.nama_stasiun}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label" htmlFor="report-month">Bulan</label>
            <select id="report-month" className="form-control" value={period?.bulan || ''} disabled={!period || isEdit || saving} onChange={(event) => changePeriod('bulan', event.target.value)}>
              {!period && <option value="">Memuat periode…</option>}
              {MONTHS.map((month, index) => <option value={index + 1} key={month}>{month}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label" htmlFor="report-year">Tahun</label>
            <input id="report-year" className="form-control" type="number" min="1900" max="9999" value={period?.tahun || ''} disabled={!period || isEdit || saving} onChange={(event) => changePeriod('tahun', event.target.value)} />
          </div>
          <div className="form-group"><label className="form-label" htmlFor="report-reference">No. Ref</label>
            <input id="report-reference" className="form-control" value={report?.no_ref || ''} disabled placeholder="Otomatis saat draft disimpan" />
          </div>
        </div>
        {calendarError && <p role="alert">{calendarError}</p>}
        {matchingCalendar && <>
          {matchingCalendar.scheme === 'fixed_dates' && <p className="report-form-notice">Laporan ini memakai jadwal lama. Rentangnya dipertahankan agar hasil pemeriksaan yang sudah tersimpan tidak berpindah minggu.</p>}
          {matchingCalendar.scheme === 'monday' && weeks.every((week) => week.state === 'future') &&
            <p className="report-form-notice">M1 belum dimulai. Minggu berjalan ada pada laporan {MONTHS[matchingCalendar.currentPeriod.bulan - 1]} {matchingCalendar.currentPeriod.tahun}.</p>}
          <div className="report-weeks">{weeks.map((week) => <div key={week.number} className={`report-week ${isWeekLocked(week) ? '' : 'report-week-current'}`}>
            <strong>{week.label} · tanggal {week.range}</strong>
            <span>{!canEdit ? 'Laporan terkunci' : weekStateLabel(week.state)}</span>
          </div>)}</div>
        </>}
      </div>
      <p className="report-form-notice">{points.length} kelompok lokasi · {points.reduce((sum, point) => sum + (point.jumlah_kamera || 1), 0)} kamera. Setiap kelompok memiliki status Berfungsi dan Terbackup.</p>
      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : points.length > 0 ? <>
        <MobileMonitoringList weeks={weeks} points={visiblePoints} station={station}
          valuesFor={(point) => detailsMap[point.id] || {}} disabled={disabled}
          isWeekLocked={isWeekLocked} weekLockReason={weekLockReason} onChange={toggle} />
        <div className="table-container monitoring-grid report-form-section desktop-monitoring">
          <table>
            <thead>
              <tr><th rowSpan={3}>No</th><th rowSpan={3} className="col-nama">Penempatan / Objek Pantau</th>
                {weeks.map((week) => <th key={week.number} colSpan={2}
                  title={isWeekLocked(week) ? `Terkunci: ${weekLockReason(week)}` : 'Minggu berjalan, dapat diisi'}>
                  {week.label} ({week.range})
                </th>)}</tr>
              <tr>{weeks.map((week) => <th key={week.number} colSpan={2} className="report-week-progress">
                {completed(week)}/{points.length} kelompok lengkap
                <span>{report?.[`checked_at_m${week.number}`] ? `Terakhir diisi: ${report[`checked_at_m${week.number}`]}` : 'Belum tersimpan'}</span>
              </th>)}</tr>
              <tr>{weeks.map((week) => <Fragment key={week.number}><th>Berfungsi</th><th>Terbackup</th></Fragment>)}</tr>
            </thead>
            <tbody>{visiblePoints.map((point) => <tr key={point.id}>
              <td>{point.nomor_urut}</td><td className="col-nama">{pointLabel(point, station)}</td>
              {weeks.map((week) => <Fragment key={week.number}>{['berfungsi', 'terbackup'].map((kind) => {
                const field = `m${week.number}_${kind}`;
                return <td key={kind}><StatusToggle value={detailsMap[point.id]?.[field] || '-'}
                  label={`${pointLabel(point, station)}, ${week.label}, ${kind === 'berfungsi' ? 'Berfungsi' : 'Terbackup'}`}
                  disabled={disabled} locked={isWeekLocked(week)} lockReason={weekLockReason(week)}
                  onChange={(value) => toggle(point.id, week, field, value)} /></td>;
              })}</Fragment>)}
            </tr>)}</tbody>
          </table>
        </div>
        {totalPages > 1 && <div className="report-pagination">
          <span>Halaman {currentPage} dari {totalPages} · maksimal 20 kelompok per halaman</span>
          <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Sebelumnya</button>
          <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Berikutnya</button>
        </div>}
      </> : <div className="card empty-state"><p>{selectedStation ? 'Belum ada kelompok CCTV aktif di stasiun ini.' : 'Pilih stasiun untuk menampilkan kelompok CCTV.'}</p></div>}
      <div className="card report-form-section"><label className="form-label" htmlFor="report-notes">Catatan Tambahan</label>
        <textarea id="report-notes" className="form-control" rows={3} value={catatan} disabled={!canEdit || saving} onChange={(event) => setCatatan(event.target.value)} />
      </div>
      {lastSaved && <p role="status" className="report-form-notice">Draft tersimpan pukul {lastSaved} WIB.</p>}
      <div className="report-form-actions">
        <button onClick={() => save(false)} disabled={disabled} className="btn btn-secondary"><FiSave /> {saving ? 'Menyimpan...' : 'Simpan Draft'}</button>
        <button onClick={() => save(true)} disabled={disabled} className="btn btn-primary"><FiSend /> Submit untuk Review</button>
      </div>
    </div>
  );
}

export default function ReportFormPage() {
  const { id } = useParams();
  return <ReportForm key={id || 'new'} />;
}
