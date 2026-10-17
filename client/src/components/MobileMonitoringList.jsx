import { useId, useState } from 'react';
import StatusToggle from './StatusToggle';
import { pointLabel, weekStateLabel } from '../utils/reportPresentation';
import './MobileMonitoringList.css';

export default function MobileMonitoringList({ weeks, points, station, valuesFor, readOnly = false,
  disabled = false, isWeekLocked, weekLockReason, onChange }) {
  const selectId = useId();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const week = weeks.find((item) => item.number === selectedWeek) || weeks.find((item) => item.state === 'current') || weeks[0];
  if (!week) return null;
  const locked = !readOnly && isWeekLocked(week);

  return <section className="mobile-monitoring" aria-label="Pemeriksaan kelompok CCTV per minggu">
    <div className="card mobile-monitoring-period">
      <label className="form-label" htmlFor={selectId}>Minggu pemeriksaan</label>
      <select id={selectId} className="form-control" value={week.number} onChange={(event) => setSelectedWeek(Number(event.target.value))}>
        {weeks.map((item) => <option key={item.number} value={item.number}>{item.label} · {item.range}</option>)}
      </select>
      {!readOnly && <p>{locked ? weekLockReason(week) : weekStateLabel(week.state)}</p>}
    </div>
    <div className="mobile-monitoring-groups">
      {points.map((point) => <div className="card mobile-monitoring-group" key={point.id}>
        <h3>{point.nomor_urut}. {pointLabel(point, station)}</h3>
        <div className="mobile-monitoring-statuses">
          {['berfungsi', 'terbackup'].map((kind) => {
            const value = valuesFor(point)[`m${week.number}_${kind}`] || '-';
            const label = kind === 'berfungsi' ? 'Berfungsi' : 'Terbackup';
            return <div className="mobile-monitoring-status" key={kind}>
              <span>{label}</span>
              {readOnly ? <span className={`monitoring-value status-${value.toLowerCase()}`} aria-label={`${label}: ${value}`}>
                {value === 'V' ? '✓' : value === 'X' ? '✗' : '—'}
              </span> : <StatusToggle value={value} label={`${pointLabel(point, station)}, ${week.label}, ${label}`}
                disabled={disabled} locked={locked} lockReason={weekLockReason(week)}
                onChange={(nextValue) => onChange(point.id, week, `m${week.number}_${kind}`, nextValue)} />}
            </div>;
          })}
        </div>
      </div>)}
    </div>
  </section>;
}
