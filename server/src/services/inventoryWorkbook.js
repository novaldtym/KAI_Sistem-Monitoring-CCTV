const crypto = require('node:crypto');
const xlsx = require('xlsx');
const { normalizeCCTVType } = require('../constants/cctv');

const SHEET_NAME = 'Form Pendataan CCTV';
const WILAYAH = 'Daop 6 Yogyakarta';
const HEADERS = {
  wilayah: 'Wilayah (Kantor Pusat/Daop/Divre)',
  unit_pengelola: 'Unit Pemilik/Pengelola',
  kategori: 'Kategori CCTV',
  nama_stasiun: 'Nama Lokasi',
  nama_titik: 'Detail Penempatan/Objek Pantau',
  jenis: 'Jenis CCTV',
  merk: 'Merek CCTV',
  fungsi_ai: 'Fungsi AI',
  jumlah_kamera: 'Jumlah Kamera',
  keterangan: 'Keterangan',
};

const cleanText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const normalizeText = (value) => cleanText(value).normalize('NFKC').toLowerCase();
const normalizeStationName = (value) => normalizeText(value)
  .replace(/^stasiun(?:\s+|$)/, '').replace(/[^\p{L}\p{N}]/gu, '');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const invalidFile = (message) => Object.assign(new Error(message), { statusCode: 400 });

function parseInventoryWorkbook(buffer) {
  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: 'buffer' });
  } catch {
    throw invalidFile('File Excel tidak dapat dibaca. Pilih file .xlsx atau .xls yang valid.');
  }
  const sheetName = workbook.SheetNames.find((name) => normalizeText(name) === normalizeText(SHEET_NAME));
  if (!sheetName) throw invalidFile(`Sheet "${SHEET_NAME}" tidak ditemukan.`);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet['!ref']) throw invalidFile('Sheet pendataan CCTV kosong.');
  const range = xlsx.utils.decode_range(sheet['!ref']);
  if (range.e.r - range.s.r > 50000 || range.e.c > 100) {
    throw invalidFile('Sheet terlalu besar. Batas impor adalah 50.000 baris dan 101 kolom.');
  }
  const values = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: true });
  const headerIndex = values.slice(0, 30).findIndex((row) =>
    row.some((cell) => normalizeText(cell) === normalizeText(HEADERS.nama_titik)));
  if (headerIndex < 0) throw invalidFile('Header Detail Penempatan/Objek Pantau tidak ditemukan pada 30 baris pertama.');
  const columns = {};
  for (const [field, label] of Object.entries(HEADERS)) {
    const index = values[headerIndex].findIndex((cell) => normalizeText(cell) === normalizeText(label));
    if (index < 0) throw invalidFile(`Kolom "${label}" tidak ditemukan pada sheet pendataan CCTV.`);
    columns[field] = index;
  }
  const stationCodeColumn = values[headerIndex].findIndex((cell) => normalizeText(cell) === 'kode stasiun');

  const rows = [];
  const errors = [];
  const occurrences = new Map();
  let excludedRows = 0;
  let selectedRows = 0;
  let repeatedGroups = 0;
  for (let index = headerIndex + 1; index < values.length; index++) {
    const cells = values[index];
    if (!Object.values(columns).some((column) => cleanText(cells[column]))) continue;
    const row = Object.fromEntries(Object.entries(columns).map(([field, column]) => [field, cleanText(cells[column])]));
    row.kode_stasiun = stationCodeColumn < 0 ? null : cleanText(cells[stationCodeColumn]).toUpperCase() || null;
    if (normalizeText(row.wilayah).replace(/\s/g, '') !== normalizeText(WILAYAH).replace(/\s/g, '') ||
        !/^stasiun(?:\s|$)/i.test(row.nama_stasiun)) {
      excludedRows++;
      continue;
    }
    selectedRows++;
    const sourceRow = range.s.r + index + 1;
    const rowErrors = [];
    if (row.kode_stasiun && !/^[A-Z0-9]{1,10}$/.test(row.kode_stasiun)) {
      rowErrors.push('Kode Stasiun harus berisi 1–10 huruf atau angka tanpa spasi.');
    }
    const limits = { nama_stasiun: 100, nama_titik: 150, unit_pengelola: 100, kategori: 100, merk: 50, fungsi_ai: 255, keterangan: 60000 };
    for (const [field, limit] of Object.entries(limits)) {
      if (row[field].length > limit) rowErrors.push(`${HEADERS[field]} melebihi ${limit} karakter.`);
    }
    for (const field of ['nama_titik', 'unit_pengelola', 'kategori']) {
      if (!row[field]) rowErrors.push(`${HEADERS[field]} wajib diisi.`);
    }
    if (!normalizeStationName(row.nama_stasiun)) rowErrors.push('Nama stasiun belum diisi.');
    const quantity = row.jumlah_kamera === '' ? NaN : Number(row.jumlah_kamera);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) {
      rowErrors.push('Jumlah Kamera harus berupa bilangan bulat positif.');
    }
    const type = normalizeCCTVType(row.jenis);
    if (!type) rowErrors.push('Jenis CCTV harus IP Camera, Analog Camera, atau Standalone Camera.');
    if (rowErrors.length) {
      errors.push(...rowErrors.map((message) => ({ row: sourceRow, message })));
      continue;
    }

    const identity = JSON.stringify([
      normalizeText(WILAYAH), normalizeStationName(row.nama_stasiun),
      normalizeText(row.unit_pengelola), normalizeText(row.kategori), normalizeText(row.nama_titik),
    ]);
    const occurrence = (occurrences.get(identity) || 0) + 1;
    occurrences.set(identity, occurrence);
    if (occurrence > 1) repeatedGroups++;
    rows.push({
      ...row, wilayah: WILAYAH, jenis: type, jumlah_kamera: quantity,
      merk: row.merk || null, fungsi_ai: row.fungsi_ai || null, keterangan: row.keterangan || null,
      source_row: sourceRow,
      import_key: digest(JSON.stringify([identity, occurrence])),
    });
  }
  if (!selectedRows) throw invalidFile('Tidak ada baris Stasiun di Daop 6 Yogyakarta pada file ini.');
  return { sheetName, headerRow: range.s.r + headerIndex + 1, rows, errors, excludedRows, selectedRows, repeatedGroups };
}

module.exports = { parseInventoryWorkbook, normalizeStationName, digest, WILAYAH, SHEET_NAME };
