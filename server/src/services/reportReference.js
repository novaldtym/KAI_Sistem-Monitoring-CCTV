const { sequelize, MonitoringReport, ReportReferenceCounter } = require('../models');

const MAX_NUMBER = 4294967295;
const formatReference = (number, bulan, tahun) =>
  `${String(number).padStart(2, '0')}/${String(bulan).padStart(2, '0')}/${tahun}`;

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

async function allocateReportReference(bulan, tahun, transaction) {
  const counter = await lockPeriodCounter(bulan, tahun, transaction);
  const number = nextNumber(counter.last_number);
  await counter.update({ last_number: number }, { transaction });
  return formatReference(number, bulan, tahun);
}

async function initializeReportReferences() {
  const periods = await MonitoringReport.findAll({ attributes: ['bulan', 'tahun'], group: ['bulan', 'tahun'], raw: true });
  let assigned = 0;
  for (const { bulan, tahun } of periods) {
    await sequelize.transaction(async (transaction) => {
      const counter = await lockPeriodCounter(bulan, tahun, transaction);
      const reports = await MonitoringReport.findAll({
        where: { bulan, tahun }, attributes: ['id', 'no_ref', 'createdAt'],
        order: [['createdAt', 'ASC'], ['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE,
      });
      const numbered = reports.filter((report) => report.no_ref?.trim());
      const existingNumbers = numbered.map((report) => {
        const match = report.no_ref.trim().match(/^(\d+)(?:\/\d{1,2}\/\d{4})?$/);
        return match ? Number(match[1]) : 0;
      });
      let lastNumber = Math.max(counter.last_number, numbered.length, ...existingNumbers);
      for (const report of reports.filter((item) => !item.no_ref?.trim())) {
        lastNumber = nextNumber(lastNumber);
        await report.update({ no_ref: formatReference(lastNumber, bulan, tahun) }, { transaction, silent: true });
        assigned++;
      }
      await counter.update({ last_number: lastNumber }, { transaction });
    });
  }
  return assigned;
}

module.exports = { allocateReportReference, initializeReportReferences };
