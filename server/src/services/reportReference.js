const { sequelize, MonitoringReport, ReportReferenceCounter, Station } = require('../models');

const MAX_NUMBER = 4294967295;
const stationCode = (value) => typeof value === 'string' ? value.trim().toUpperCase() : '';
const validCode = (value) => /^[A-Z0-9]{1,10}$/.test(value);
const formatReference = (number, bulan, tahun, code) =>
  `${code}/${String(number).padStart(2, '0')}/${String(bulan).padStart(2, '0')}/${tahun}`;

function referenceParts(value) {
  const reference = value?.trim() || '';
  const prefixed = reference.match(/^([A-Z0-9]{1,10})\/(\d+)\/(\d{1,2})\/(\d{4})$/i);
  const legacy = reference.match(/^(\d+)(?:\/(\d{1,2})\/(\d{4}))?$/);
  if (!prefixed && !legacy) return null;
  const code = prefixed?.[1] || null;
  const digits = prefixed ? prefixed[2] : legacy[1];
  const bulan = prefixed ? prefixed[3] : legacy[2];
  const tahun = prefixed ? prefixed[4] : legacy[3];
  const number = Number(digits);
  return Number.isInteger(number) && number > 0 && number <= MAX_NUMBER
    ? { code, digits, number, bulan: Number(bulan) || null, tahun: Number(tahun) || null } : null;
}

function nextNumber(lastNumber) {
  if (!Number.isInteger(lastNumber) || lastNumber < 0 || lastNumber >= MAX_NUMBER) {
    throw new Error('Urutan nomor referensi sudah melampaui batas.');
  }
  return lastNumber + 1;
}

async function lockPeriodCounter(bulan, tahun, transaction) {
  if (!transaction) throw new Error('Nomor referensi harus dibuat di dalam transaksi laporan.');
  // The upsert also locks a period's first allocation, when no counter row exists yet.
  await sequelize.query(
    'INSERT INTO report_reference_counters (bulan, tahun, last_number) VALUES (:bulan, :tahun, 0) ' +
    'ON DUPLICATE KEY UPDATE last_number = last_number',
    { replacements: { bulan, tahun }, transaction },
  );
  return ReportReferenceCounter.findOne({ where: { bulan, tahun }, transaction, lock: transaction.LOCK.UPDATE });
}

async function allocateReportReference(bulan, tahun, kodeStasiun, transaction) {
  const code = stationCode(kodeStasiun);
  if (!validCode(code)) {
    throw Object.assign(new Error('Kode stasiun belum valid. Lengkapi Kode Stasiun di Master Stasiun sebelum membuat laporan.'), { statusCode: 400 });
  }
  const counter = await lockPeriodCounter(bulan, tahun, transaction);
  const number = nextNumber(counter.last_number);
  await counter.update({ last_number: number }, { transaction });
  return formatReference(number, bulan, tahun, code);
}

async function initializeReportReferences() {
  const periods = await MonitoringReport.findAll({ attributes: ['bulan', 'tahun'], group: ['bulan', 'tahun'], raw: true });
  const stations = await Station.findAll({ attributes: ['id', 'kode_stasiun'], raw: true });
  const codes = new Map(stations.map((station) => [station.id, stationCode(station.kode_stasiun)]));
  let assigned = 0;
  let skipped = 0;
  for (const { bulan, tahun } of periods) {
    await sequelize.transaction(async (transaction) => {
      const counter = await lockPeriodCounter(bulan, tahun, transaction);
      const reports = await MonitoringReport.findAll({
        where: { bulan, tahun }, attributes: ['id', 'station_id', 'no_ref', 'createdAt'],
        order: [['createdAt', 'ASC'], ['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE,
      });
      const numbered = reports.filter((report) => report.no_ref?.trim());
      const existingNumbers = numbered.map((report) => referenceParts(report.no_ref)?.number || 0);
      let lastNumber = Math.max(counter.last_number, numbered.length, ...existingNumbers);
      for (const report of reports) {
        const reference = report.no_ref?.trim();
        const parts = referenceParts(reference);
        // Issued references retain their station code even if master data changes later.
        if (parts?.code) continue;
        const code = codes.get(report.station_id);
        if (!validCode(code) || (reference && (!parts || (parts.bulan && (parts.bulan !== bulan || parts.tahun !== tahun))))) {
          skipped++;
          continue;
        }
        if (!reference) lastNumber = nextNumber(lastNumber);
        await report.update({ no_ref: formatReference(parts?.digits || lastNumber, bulan, tahun, code) }, { transaction, silent: true });
        assigned++;
      }
      await counter.update({ last_number: lastNumber }, { transaction });
    });
  }
  if (skipped) console.warn(`Nomor referensi ${skipped} laporan lama dipertahankan. Periksa kode stasiun dan format referensinya.`);
  return assigned;
}

module.exports = { allocateReportReference, initializeReportReferences };
