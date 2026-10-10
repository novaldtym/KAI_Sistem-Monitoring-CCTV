const { Transaction } = require('sequelize');
const { sequelize, Station, CCTVPoint } = require('../models');
const { parseInventoryWorkbook, normalizeStationName, digest, WILAYAH } = require('./inventoryWorkbook');

const POINT_FIELDS = ['nama_titik', 'unit_pengelola', 'kategori', 'jenis', 'merk', 'fungsi_ai', 'jumlah_kamera', 'keterangan'];
const pointValues = (row) => Object.fromEntries(POINT_FIELDS.map((field) => [field, row[field]]));
const pointChanged = (point, row) => POINT_FIELDS.some((field) => (point[field] ?? null) !== (row[field] ?? null));
const conflict = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

async function planImport(buffer, transaction) {
  const parsed = parseInventoryWorkbook(buffer);
  const queryOptions = { raw: true, order: [['id', 'ASC']] };
  if (transaction) Object.assign(queryOptions, { transaction, lock: transaction.LOCK.UPDATE });
  const stations = await Station.findAll(queryOptions);
  const points = await CCTVPoint.findAll(queryOptions);
  const errors = [...parsed.errors];
  const stationGroups = new Map();
  const existingPoints = new Map(points.filter((point) => point.import_key).map((point) => [point.import_key, point]));
  const rowKeys = new Set(parsed.rows.map((row) => row.import_key));
  const stats = { stationCount: 0, groupCount: parsed.rows.length, cameraCount: 0,
    newStations: 0, newGroups: 0, updatedGroups: 0, unchangedGroups: 0, inactiveGroups: 0, preservedGroups: 0 };

  for (const row of parsed.rows) {
    const nameKey = normalizeStationName(row.nama_stasiun);
    if (!stationGroups.has(nameKey)) {
      const matches = stations.filter((station) => normalizeStationName(station.nama_stasiun) === nameKey);
      const existing = matches.length === 1 ? matches[0] : null;
      if (matches.length > 1) errors.push({ row: row.source_row, message: `Nama ${row.nama_stasiun} cocok dengan beberapa stasiun. Rapikan data stasiun terlebih dahulu.` });
      if (existing && (!existing.is_active || (existing.wilayah && existing.wilayah !== WILAYAH))) {
        errors.push({ row: row.source_row, message: `${row.nama_stasiun} sudah terdaftar tetapi nonaktif atau Wilayah berbeda. Periksa Master Stasiun.` });
      }
      const stationPoints = existing ? points.filter((point) => point.station_id === existing.id) : [];
      stationGroups.set(nameKey, {
        nama_stasiun: row.nama_stasiun, existing,
        kode_stasiun: null,
        groupCount: 0, cameraCount: 0, rows: [],
        nextNumber: stationPoints.reduce((max, point) => Math.max(max, point.nomor_urut), 0),
        preservedGroups: stationPoints.filter((point) => point.is_active && !rowKeys.has(point.import_key)).length,
      });
      if (!existing) stats.newStations++;
    }
    const group = stationGroups.get(nameKey);
    if (row.kode_stasiun) {
      if (group.kode_stasiun && group.kode_stasiun !== row.kode_stasiun) {
        errors.push({ row: row.source_row, message: `Kode Stasiun untuk ${row.nama_stasiun} berbeda antarbaris Excel.` });
      } else group.kode_stasiun = row.kode_stasiun;
      if (group.existing?.kode_stasiun && group.existing.kode_stasiun !== row.kode_stasiun) {
        errors.push({ row: row.source_row, message: `Kode Stasiun ${row.kode_stasiun} berbeda dengan kode ${group.existing.kode_stasiun} di Master Stasiun.` });
      }
    }
    group.groupCount++;
    group.cameraCount += row.jumlah_kamera;
    stats.cameraCount += row.jumlah_kamera;
    const existingPoint = existingPoints.get(row.import_key);
    if (existingPoint && existingPoint.station_id !== group.existing?.id) {
      errors.push({ row: row.source_row, message: 'Kelompok hasil impor sebelumnya terhubung ke stasiun yang berbeda.' });
    }
    const action = !existingPoint ? 'create' : pointChanged(existingPoint, row) ? 'update' : 'unchanged';
    if (action === 'create') stats.newGroups++;
    else if (action === 'update') stats.updatedGroups++;
    else stats.unchangedGroups++;
    if (existingPoint && !existingPoint.is_active) stats.inactiveGroups++;
    group.rows.push({ row, existingPoint, action });
  }
  stats.stationCount = stationGroups.size;
  const codeOwners = new Map();
  for (const [nameKey, group] of stationGroups) {
    const code = group.kode_stasiun || group.existing?.kode_stasiun;
    if (!code) continue;
    const otherStation = stations.find((station) => station.kode_stasiun === code && normalizeStationName(station.nama_stasiun) !== nameKey);
    if (otherStation || (codeOwners.has(code) && codeOwners.get(code) !== nameKey)) {
      errors.push({ row: group.rows[0].row.source_row, message: `Kode Stasiun ${code} digunakan oleh stasiun lain.` });
    }
    codeOwners.set(code, nameKey);
  }
  stats.preservedGroups = [...stationGroups.values()].reduce((sum, group) => sum + group.preservedGroups, 0);
  const warnings = [];
  if (parsed.repeatedGroups) warnings.push(`${parsed.repeatedGroups} baris mengulang penempatan, unit, dan kategori yang sama. Baris tetap disimpan sebagai kelompok terpisah sesuai Excel.`);
  if (stats.preservedGroups) warnings.push(`${stats.preservedGroups} kelompok aktif yang sudah ada dan tidak berasal dari file ini tetap disimpan. Total inventaris mencakup kelompok tersebut.`);
  if (stats.inactiveGroups) warnings.push(`${stats.inactiveGroups} kelompok impor yang pernah dinonaktifkan tetap nonaktif.`);

  const fingerprint = digest(JSON.stringify({
    file: digest(buffer),
    stations: stations.map((station) => [station.id, station.nama_stasiun, station.kode_stasiun, station.wilayah, station.is_active]),
    points: points.map((point) => [point.id, point.station_id, point.nomor_urut, point.import_key, point.is_active, pointValues(point)]),
  }));
  return { parsed, stationGroups, fingerprint, stats, errors, warnings };
}

function previewData(plan) {
  return {
    sheetName: plan.parsed.sheetName, headerRow: plan.parsed.headerRow,
    scope: WILAYAH,
    excludedRows: plan.parsed.excludedRows, selectedRows: plan.parsed.selectedRows,
    summary: plan.stats, fingerprint: plan.fingerprint,
    canImport: plan.errors.length === 0, errors: plan.errors, warnings: plan.warnings,
    stations: [...plan.stationGroups.values()].map((group) => ({
      nama_stasiun: group.nama_stasiun, station_id: group.existing?.id ?? null,
      kode_stasiun: group.kode_stasiun || group.existing?.kode_stasiun || null,
      groupCount: group.groupCount, cameraCount: group.cameraCount, preservedGroups: group.preservedGroups,
    })),
    sampleRows: plan.parsed.rows.slice(0, 20).map(({ import_key, ...row }) => row),
  };
}

async function importInventory(buffer, fingerprint) {
  if (!fingerprint) throw conflict('Tinjau pratinjau file terlebih dahulu sebelum menyimpan.');
  return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (transaction) => {
    const plan = await planImport(buffer, transaction);
    if (plan.errors.length) throw conflict('File memiliki kesalahan. Perbaiki baris yang ditandai pada pratinjau.');
    if (fingerprint !== plan.fingerprint) throw conflict('File atau data master berubah setelah pratinjau. Buat pratinjau ulang sebelum menyimpan.', 409);
    for (const group of plan.stationGroups.values()) {
      let station = group.existing;
      if (!station) {
        station = await Station.create({ nama_stasiun: group.nama_stasiun, kode_stasiun: group.kode_stasiun, wilayah: WILAYAH }, { transaction });
      } else {
        const updates = {};
        if (!station.wilayah) updates.wilayah = WILAYAH;
        if (!station.kode_stasiun && group.kode_stasiun) updates.kode_stasiun = group.kode_stasiun;
        if (Object.keys(updates).length) await Station.update(updates, { where: { id: station.id }, transaction });
      }
      for (const { row, existingPoint, action } of group.rows) {
        if (action === 'create') {
          await CCTVPoint.create({ ...pointValues(row), import_key: row.import_key,
            station_id: station.id, nomor_urut: ++group.nextNumber }, { transaction });
        } else if (action === 'update') {
          await CCTVPoint.update(pointValues(row), { where: { id: existingPoint.id }, transaction });
        }
      }
    }
    return plan.stats;
  });
}

module.exports = { planImport, previewData, importInventory };
