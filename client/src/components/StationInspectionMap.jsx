import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiX } from 'react-icons/fi';
import { getStationInspectionApi } from '../services/api';
import './StationInspectionMap.css';

const WIDTH = 1320;
const HEIGHT = 770;
const MAIN_CODES = ['YK', 'LPN', 'MGW', 'BBN', 'SWT', 'KT', 'CE', 'DL', 'GW', 'PWS', 'SLO', 'SK', 'PL', 'KMR', 'MSR', 'SR', 'KRO', 'KDB'];
const MAIN_NODES = MAIN_CODES.map((code, index) => ({ code, x: 96 + index * 66, y: 340 }));
const WEST_NODES = ['PTN', 'RWL', 'STL', 'WT', 'KDG', 'WJ', 'JN'].map((code, index) => ({ code, x: 96, y: 394 + index * 54 }));
const NORTH_NODES = ['KDO', 'KO', 'SLM', 'SUM', 'GPK'].map((code, index) => ({ code, x: 756, y: 286 - index * 54 }));
const SOUTH_NODES = ['STA', 'SKH', 'PNT', 'WNG'].map((code, index) => ({ code, x: 690, y: 410 + index * 64 }));
const NODES = [...MAIN_NODES, ...WEST_NODES, ...NORTH_NODES, ...SOUTH_NODES,
  { code: 'SMO', x: 636, y: 286 }, { code: 'YIA', x: 210, y: 610 }];
const KNOWN_CODES = new Set(NODES.map((node) => node.code));
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const codeOf = (station) => (station.kode_stasiun || '').trim().toUpperCase();
const monthValue = ({ bulan, tahun }) => `${tahun}-${String(bulan).padStart(2, '0')}`;
const progressFor = (station, week) => week === 'month' ? station.monthly : station.weeks.find((item) => item.number === week);
const statusFor = (station, progress) => !station.totalGroups ? 'no-groups' : !progress.totalGroups ? 'scheduled' : progress.complete ? 'complete' : 'incomplete';
const statusText = (status) => ({ complete: 'Sudah diperiksa', incomplete: 'Belum lengkap', 'no-groups': 'Tanpa kelompok CCTV', scheduled: 'Belum dimulai' }[status]);

function StationInspectionDialog({ station, calendar, week, periodLabel, scopeLabel, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const dismissBackdrop = (event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  };

  return (
    <dialog ref={dialogRef} className="station-inspection-dialog" aria-modal="true"
      aria-labelledby="station-inspection-dialog-title" aria-describedby="station-inspection-dialog-summary"
      onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={dismissBackdrop}>
      <div className="station-inspection-dialog-header">
        <div>
          <h3 id="station-inspection-dialog-title">{station.nama_stasiun} {station.kode_stasiun && `(${station.kode_stasiun})`}</h3>
          <p>{periodLabel} · {scopeLabel}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-icon" onClick={onClose} aria-label="Tutup detail stasiun">
          <FiX aria-hidden="true" />
        </button>
      </div>
      <p id="station-inspection-dialog-summary">
        {!station.totalGroups ? 'Belum ada kelompok CCTV untuk diperiksa.' : !station.hasReport ? 'Laporan bulan ini belum dibuat.' : `${station.totalGroups} kelompok CCTV dalam laporan.`}
        {progressFor(station, week).overdue && ' Ada minggu yang terlewat atau belum lengkap.'}
      </p>
      {station.legacySchedule && <p>Laporan memakai jadwal lama. Peta menghitung pemeriksaan hanya jika rentang minggunya sama; lihat laporan untuk jadwal aslinya.</p>}
      <div className="inspection-map-detail-weeks">
        {calendar.weeks.map((item, index) => <span key={item.number}>
          <strong>{item.label} ({item.range})</strong>
          {item.state === 'future' ? 'Belum dimulai' : !station.totalGroups ? 'Tanpa CCTV' : `${station.weeks[index].completedGroups}/${station.weeks[index].totalGroups} kelompok diperiksa`}
        </span>)}
      </div>
      <div className="station-inspection-dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>
        {station.reportId && <Link to={`/reports/${station.reportId}`} className="btn btn-primary">Buka laporan</Link>}
      </div>
    </dialog>
  );
}

export default function StationInspectionMap() {
  const [period, setPeriod] = useState('');
  const [requestedWeek, setWeek] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (loading || !data || !window.matchMedia('(max-width: 700px)').matches) return;
    const canvas = canvasRef.current;
    const svg = canvas?.querySelector('svg');
    if (svg) canvas.scrollTop = Math.max(0, 340 * svg.getBoundingClientRect().height / HEIGHT - 100);
  }, [loading, data]);

  useEffect(() => {
    let active = true;
    const [tahun, bulan] = period.split('-');
    getStationInspectionApi(period ? { bulan, tahun } : {})
      .then((res) => { if (active) { setData(res.data.data); setError(''); } })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Gagal memuat pemeriksaan stasiun. Klik Perbarui untuk mencoba lagi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period, revision]);

  const refresh = () => { setLoading(true); setRevision((value) => value + 1); };
  const calendar = data?.calendar;
  const stations = data?.stations || [];
  const week = requestedWeek === 'month' || calendar?.weeks.some((item) => item.number === requestedWeek && item.state !== 'future') ? requestedWeek : 'month';
  const selectedWeek = calendar?.weeks.find((item) => item.number === week);
  const selected = stations.find((station) => station.id === selectedId);
  const startedWeeks = calendar?.weeks.filter((item) => item.state !== 'future') || [];
  const periodLabel = calendar ? `${MONTHS[calendar.bulan - 1]} ${calendar.tahun}` : '';
  const scopeLabel = week === 'month' ? `Bulanan${startedWeeks.length ? ` · M1–M${startedWeeks.length}` : ''}` : `${selectedWeek?.label} · tanggal ${selectedWeek?.range}`;
  const byCode = new Map(stations.map((station) => [codeOf(station), station]));
  const unmapped = stations.filter((station) => !KNOWN_CODES.has(codeOf(station)) || byCode.get(codeOf(station))?.id !== station.id);
  const checked = stations.filter((station) => progressFor(station, week)?.complete).length;
  const unchecked = stations.filter((station) => statusFor(station, progressFor(station, week)) === 'incomplete').length;
  const noGroups = stations.filter((station) => !station.totalGroups).length;

  const selectWeek = (value) => { setWeek(value); setSelectedId(null); };
  const openStation = (stationId, event) => {
    event.currentTarget.focus({ preventScroll: true });
    setSelectedId(stationId);
  };
  const changePeriod = (event) => {
    if (!event.target.value || !event.target.reportValidity()) return;
    setLoading(true); setPeriod(event.target.value); setWeek('month'); setSelectedId(null);
  };

  return (
    <section className="card inspection-map" aria-labelledby="inspection-map-heading">
      <div className="inspection-map-header">
        <div>
          <h2 id="inspection-map-heading">Peta Pemeriksaan Stasiun</h2>
          <p>Daop 6 Yogyakarta · {periodLabel || 'Pemeriksaan CCTV'}</p>
        </div>
        <div className="inspection-map-controls">
          <label htmlFor="inspection-map-period">Bulan
            <input id="inspection-map-period" type="month" className="form-control"
              min="1900-01" max={data ? monthValue(data.currentPeriod) : undefined}
              value={period || (calendar ? monthValue(calendar) : '')} onChange={changePeriod} disabled={!data || loading} />
          </label>
          <button type="button" className="btn btn-secondary" onClick={refresh} disabled={loading}>
            <FiRefreshCw aria-hidden="true" /> Perbarui
          </button>
        </div>
      </div>

      {calendar && <div className="inspection-map-weeks" role="group" aria-label="Pilih rentang pemeriksaan">
        <button type="button" className={week === 'month' ? 'active' : ''} aria-pressed={week === 'month'}
          onClick={() => selectWeek('month')} disabled={loading}>Bulanan</button>
        {calendar.weeks.map((item) => <button key={item.number} type="button"
          className={week === item.number ? 'active' : ''} aria-pressed={week === item.number}
          disabled={loading || item.state === 'future'} title={item.state === 'future' ? 'Minggu ini belum dimulai' : `${item.label}, tanggal ${item.range}`}
          onClick={() => selectWeek(item.number)}>
          {item.label} <span>{item.range}{item.state === 'current' ? ' · berjalan' : ''}</span>
        </button>)}
      </div>}

      {loading ? <div className="inspection-map-message" role="status">Memuat pemeriksaan stasiun…</div> : error ?
        <div className="inspection-map-message inspection-map-error" role="alert">{error}</div> : stations.length === 0 ?
        <div className="inspection-map-message">Belum ada stasiun Daop 6. Tambahkan stasiun atau impor Excel melalui Master Stasiun.</div> : <>
          <div className="inspection-map-summary" aria-live="polite">
            <strong>{scopeLabel}</strong>
            <div className="inspection-map-legend">
              <span><i className="inspection-dot complete" aria-hidden="true">✓</i> Sudah diperiksa ({checked})</span>
              <span><i className="inspection-dot incomplete" aria-hidden="true">−</i> Belum lengkap ({unchecked})</span>
              {noGroups > 0 && <span><i className="inspection-dot no-groups" aria-hidden="true">−</i> Tanpa CCTV ({noGroups})</span>}
            </div>
          </div>
          <p className="inspection-map-explanation">
            {week === 'month' ? 'Bulanan menghitung semua minggu yang sudah dimulai. ' : ''}
            Hijau jika Berfungsi dan Terbackup sudah terisi V/X pada seluruh kelompok. Merah jika masih ada yang kosong.
          </p>
          <p className="mobile-scroll-hint">Geser peta untuk melihat stasiun, lalu ketuk lingkaran stasiunnya.</p>
          <div className="inspection-map-canvas" ref={canvasRef} tabIndex={0} role="region" aria-label="Diagram stasiun, dapat digeser pada layar kecil">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label={`Peta pemeriksaan ${periodLabel}, ${scopeLabel}`}>
              <g className="inspection-tracks" aria-hidden="true">
                <path className="double-track" d="M96 746 V340 H1274 M756 340 V286" />
                <path className="track-center" d="M96 746 V340 H1274 M756 340 V286" />
                <path className="single-track" d="M96 610 H210 M756 286 H636 M756 286 V36 M690 340 V650" />
                <text x="270" y="300">YOGYAKARTA – SOLO</text>
                <text x="984" y="300">ARAH MADIUN</text>
                <text x="788" y="70">ARAH SEMARANG</text>
                <text x="220" y="690">ARAH KUTOARJO</text>
                <text x="722" y="644">WONOGIRI</text>
                <text x="250" y="614">BANDARA YIA</text>
                <text x="508" y="289">ADI SOEMARMO</text>
              </g>
              {NODES.map((node) => {
                const station = byCode.get(node.code);
                if (!station) return null;
                const progress = progressFor(station, week);
                const status = statusFor(station, progress);
                const label = `${station.nama_stasiun} (${node.code}). ${statusText(status)}. ${progress.completedGroups} dari ${progress.totalGroups} ${week === 'month' ? 'isian kelompok mingguan' : 'kelompok'}.${progress.overdue ? ' Ada pemeriksaan terlewat.' : ''}`;
                return <g key={station.id} className={`inspection-station ${status}${selectedId === station.id ? ' selected' : ''}`}
                  transform={`translate(${node.x} ${node.y})`} tabIndex={0} role="button" aria-label={label}
                  aria-pressed={selectedId === station.id} onClick={(event) => openStation(station.id, event)}
                  onKeyDown={(event) => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); openStation(station.id, event); } }}>
                  <title>{label}</title>
                  <circle className="station-focus-ring" r="29" />
                  <circle className="station-circle" r="23" />
                  <text className="station-code" textAnchor="middle" dominantBaseline="central" y="-5" aria-hidden="true">{node.code}</text>
                  <text className="station-state" textAnchor="middle" y="15" aria-hidden="true">{progress.complete ? '✓' : '−'}</text>
                </g>;
              })}
            </svg>
          </div>
          {unmapped.length > 0 && <div className="inspection-map-unmapped">
            <p>Stasiun di luar susunan peta</p>
            {unmapped.map((station) => <button type="button" key={station.id} className="btn btn-secondary"
              onClick={(event) => openStation(station.id, event)}>
              <i className={`inspection-dot ${statusFor(station, progressFor(station, week))}`} aria-hidden="true">{progressFor(station, week).complete ? '✓' : '−'}</i>
              {station.nama_stasiun} {station.kode_stasiun && `(${station.kode_stasiun})`}
            </button>)}
          </div>}
          <p className="inspection-map-hint">Arahkan kursor ke kode untuk melihat nama stasiun. Klik stasiun untuk melihat kelengkapan M1–M5.</p>
          {selected && <StationInspectionDialog key={selected.id} station={selected} calendar={calendar} week={week}
            periodLabel={periodLabel} scopeLabel={scopeLabel} onClose={() => setSelectedId(null)} />}
          <div className="inspection-map-footnote">
            <span><i className="inspection-track-key double" aria-hidden="true" /> Jalur ganda</span>
            <span><i className="inspection-track-key" aria-hidden="true" /> Jalur tunggal</span>
            <span>Skema mengikuti Peta Kendali, tanpa skala jarak.</span>
          </div>
        </>}
    </section>
  );
}
