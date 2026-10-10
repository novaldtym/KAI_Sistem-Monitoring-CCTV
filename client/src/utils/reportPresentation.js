export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const STATUS_FIELDS = Array.from({ length: 5 }, (_, i) => [`m${i + 1}_berfungsi`, `m${i + 1}_terbackup`]).flat();
export const emptyStatuses = () => Object.fromEntries(STATUS_FIELDS.map((field) => [field, '-']));
export const statusValues = (detail) => Object.fromEntries(STATUS_FIELDS.map((field) => [field, detail[field] || '-']));

export function pointLabel(point, station) {
  let label = point?.nama_titik || 'Kelompok CCTV';
  const prefixes = [station?.nama_stasiun, station?.nama_stasiun?.replace(/^stasiun\s+/i, ''), station?.kode_stasiun].filter(Boolean);
  for (const prefix of prefixes) {
    if (label.toLowerCase().startsWith(prefix.toLowerCase())) {
      const remaining = label.slice(prefix.length);
      if (/^\s*[-:]\s*\S/.test(remaining)) label = remaining.replace(/^\s*[-:]\s*/, '');
    }
  }
  return label;
}

export const weekStateLabel = (state) => state === 'current' ? 'Minggu berjalan' : state === 'past' ? 'Sudah lewat · terkunci' : 'Belum waktunya · terkunci';
