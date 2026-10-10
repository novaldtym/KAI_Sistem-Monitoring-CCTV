const TIME_ZONE = 'Asia/Jakarta';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const STATUS_FIELDS = Array.from({ length: 5 }, (_, i) => [`m${i + 1}_berfungsi`, `m${i + 1}_terbackup`]).flat();
const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

function jakartaDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function currentInspectionPeriod(now = new Date()) {
  const date = new Date(`${jakartaDate(now)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return { bulan: date.getUTCMonth() + 1, tahun: date.getUTCFullYear() };
}

function weekRange(start, end) {
  if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${start.getUTCDate()}–${end.getUTCDate()}`;
  }
  const differentYear = start.getUTCFullYear() !== end.getUTCFullYear();
  const label = (date) => `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]}${differentYear ? ` ${date.getUTCFullYear()}` : ''}`;
  return `${label(start)}–${label(end)}`;
}

function getCalendar(bulan, tahun, now = new Date(), scheme = 'monday') {
  const month = Number(bulan);
  const year = Number(tahun);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1900 || year > 9999) {
    throw badRequest('Bulan harus 1–12 dan tahun harus 1900–9999.');
  }
  const today = jakartaDate(now);
  const todayTime = new Date(`${today}T00:00:00Z`).getTime();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const firstMonday = 1 + (8 - firstDay.getUTCDay()) % 7;
  const weeks = [];
  for (let day = scheme === 'fixed_dates' ? 1 : firstMonday, number = 1; day <= days; day += 7, number++) {
    const start = new Date(Date.UTC(year, month - 1, day));
    const end = new Date(Date.UTC(year, month - 1, scheme === 'fixed_dates' ? Math.min(day + 6, days) : day + 6));
    weeks.push({ number, label: `M${number}`, start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0],
      range: weekRange(start, end),
      state: todayTime < start.getTime() ? 'future' : todayTime > end.getTime() ? 'past' : 'current',
      editable: todayTime >= start.getTime() && todayTime <= end.getTime() });
  }
  return { bulan: month, tahun: year, today, timeZone: TIME_ZONE, scheme, currentPeriod: currentInspectionPeriod(now), weeks };
}

function getReportCalendar(report, now = new Date()) {
  return getCalendar(report.bulan, report.tahun, now, report.calendar_scheme || 'fixed_dates');
}

function scheduleFields(calendar) {
  return Object.fromEntries(Array.from({ length: 5 }, (_, i) => [
    `tanggal_m${i + 1}`, calendar.weeks[i]?.start || null,
  ]));
}

function reportCalendarData(report, now = new Date()) {
  const calendar = getReportCalendar(report, now);
  return { ...calendar, weeks: calendar.weeks.map((week) => ({ ...week,
    editable: week.editable && ['draft', 'rejected'].includes(report.status),
    checkedAt: report[`checked_at_m${week.number}`] || null,
    completedGroups: (report.details || []).filter((detail) =>
      ['V', 'X'].includes(detail[`m${week.number}_berfungsi`]) &&
      ['V', 'X'].includes(detail[`m${week.number}_terbackup`])).length,
    totalGroups: (report.details || []).length,
  })) };
}

function validateStatusChanges(inputDetails, existingDetails, calendar) {
  if (inputDetails === undefined) return [];
  if (!Array.isArray(inputDetails)) throw badRequest('Detail pemeriksaan harus berupa daftar kelompok CCTV.');
  const existing = new Map(existingDetails.map((detail) => [Number(detail.cctv_point_id), detail]));
  const seen = new Set();
  return inputDetails.map((input) => {
    if (!input || typeof input !== 'object') throw badRequest('Detail pemeriksaan tidak valid.');
    const pointId = Number(input.cctv_point_id);
    if (!Number.isInteger(pointId) || !existing.has(pointId)) throw badRequest('Kelompok CCTV tidak terdaftar pada stasiun atau laporan ini.');
    if (seen.has(pointId)) throw badRequest('Kelompok CCTV yang sama dikirim lebih dari satu kali.');
    seen.add(pointId);
    if (Object.keys(input).some((key) => /^m\d+_/.test(key) && !STATUS_FIELDS.includes(key))) {
      throw badRequest('Kolom minggu pemeriksaan tidak dikenal.');
    }
    const previous = existing.get(pointId);
    const changes = {};
    for (const field of STATUS_FIELDS) {
      if (input[field] === undefined) continue;
      if (!['V', 'X', '-'].includes(input[field])) throw badRequest('Status pemeriksaan harus V, X, atau -.');
      if (input[field] === (previous[field] || '-')) continue;
      const number = Number(field[1]);
      if (!calendar.weeks.find((week) => week.number === number)?.editable) {
        throw Object.assign(new Error(`M${number} terkunci. Pengisian hanya diperbolehkan pada minggu berjalan menurut waktu WIB.`), { statusCode: 403 });
      }
      changes[field] = input[field];
    }
    return { cctv_point_id: pointId, changes };
  }).filter(({ changes }) => Object.keys(changes).length);
}

function checkedFields(changes, calendar) {
  return Object.fromEntries([...new Set(changes.flatMap(({ changes: fields }) => Object.keys(fields).map((field) => field[1])))]
    .map((number) => [`checked_at_m${number}`, calendar.today]));
}

function validateClientDates(body, report) {
  for (let number = 1; number <= 5; number++) {
    for (const field of [`tanggal_m${number}`, `checked_at_m${number}`]) {
      if (body[field] !== undefined && (body[field] || null) !== (report[field] || null)) {
        throw badRequest('Rentang minggu dan tanggal pemeriksaan ditetapkan oleh server.');
      }
    }
  }
}

module.exports = { getCalendar, getReportCalendar, currentInspectionPeriod, jakartaDate, scheduleFields, reportCalendarData, validateStatusChanges, checkedFields, validateClientDates, STATUS_FIELDS, badRequest };
