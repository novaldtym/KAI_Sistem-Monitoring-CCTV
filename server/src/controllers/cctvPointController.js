const { CCTVPoint, Station, sequelize } = require('../models');
const xlsx = require('xlsx');
const { normalizeCCTVType } = require('../constants/cctv');
const { deleteCCTVPoint } = require('../services/masterDeletion');

function pointPayload(body) {
  const payload = {};
  for (const field of ['nama_titik', 'nomor_urut', 'merk', 'model_cctv', 'jenis', 'tipe_lokasi', 'resolusi',
    'jumlah_kamera', 'unit_pengelola', 'kategori', 'fungsi_ai', 'keterangan']) {
    if (body[field] === undefined) continue;
    payload[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    if (!['nama_titik', 'nomor_urut', 'jumlah_kamera'].includes(field) && payload[field] === '') payload[field] = null;
  }
  if ('jenis' in payload) {
    const type = normalizeCCTVType(payload.jenis);
    if (type === undefined) throw Object.assign(new Error('Jenis CCTV harus IP Camera, Analog Camera, atau Standalone Camera.'), { statusCode: 400 });
    payload.jenis = type;
  }
  for (const field of ['nomor_urut', 'jumlah_kamera']) {
    if (!(field in payload)) continue;
    payload[field] = Number(payload[field]);
    if (!Number.isInteger(payload[field]) || payload[field] < 1 || payload[field] > 2147483647) {
      throw Object.assign(new Error(`${field} harus berupa bilangan bulat positif.`), { statusCode: 400 });
    }
  }
  if ('nama_titik' in payload && !payload.nama_titik) throw Object.assign(new Error('Nama titik CCTV wajib diisi.'), { statusCode: 400 });
  return payload;
}


exports.getByStation = async (req, res, next) => {
  try {
    const points = await CCTVPoint.findAll({
      where: { station_id: req.params.stationId, is_active: true },
      order: [['nomor_urut', 'ASC']],
    });
    res.json({ data: points });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { station_id } = req.body;
    const station = await Station.findByPk(station_id);
    if (!station) return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });

    const point = await CCTVPoint.create({ station_id, ...pointPayload(req.body) });
    res.status(201).json({ message: 'Titik CCTV berhasil ditambahkan.', data: point });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const point = await CCTVPoint.findByPk(req.params.id);
    if (!point) return res.status(404).json({ message: 'Titik CCTV tidak ditemukan.' });

    await point.update(pointPayload(req.body));
    res.json({ message: 'Titik CCTV berhasil diupdate.', data: point });
  } catch (error) {
    next(error);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ id, nomor_urut }, ...]
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Format data tidak valid.' });

    for (const item of items) {
      await CCTVPoint.update({ nomor_urut: item.nomor_urut }, { where: { id: item.id } });
    }
    res.json({ message: 'Urutan titik CCTV berhasil diupdate.' });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await deleteCCTVPoint(req.params.id);
    res.json({ message: 'Titik CCTV berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

exports.importCCTVPoints = async (req, res, next) => {
  let transaction;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }

    const { station_id } = req.body;
    if (!station_id) {
      return res.status(400).json({ message: 'station_id wajib dikirim.' });
    }

    const station = await Station.findByPk(station_id);
    if (!station) {
      return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    transaction = await sequelize.transaction();

    let successCount = 0;
    let errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; 
      
      const nomor_urut = row.nomor_urut || row['Nomor Urut'];
      const nama_titik = row.nama_titik || row['Nama Titik'];
      const merk = row.merk || row['Merk'] || null;
      const model_cctv = row.model_cctv || row['Model CCTV'] || null;
      const jenis = normalizeCCTVType(row.jenis || row['Jenis'] || row['Jenis CCTV']);
      let tipe_lokasi = (row.tipe_lokasi || row['Lokasi'])?.toLowerCase();
      const resolusi = row.resolusi || row['Resolusi'] || null;

      if (!nomor_urut || !nama_titik) {
        errors.push(`Baris ${rowNumber}: Nomor Urut dan Nama Titik wajib diisi.`);
        continue;
      }

      if (jenis === undefined) {
        errors.push(`Baris ${rowNumber}: Jenis CCTV harus IP Camera, Analog Camera, atau Standalone Camera.`);
        continue;
      }
      
      if (tipe_lokasi && !['indoor', 'outdoor'].includes(tipe_lokasi)) {
        tipe_lokasi = null;
      }

      const existing = await CCTVPoint.findOne({ where: { station_id, nomor_urut }, transaction });
      if (existing) {
        errors.push(`Baris ${rowNumber}: Nomor Urut ${nomor_urut} sudah ada di stasiun ini.`);
        continue;
      }

      let payload;
      try {
        payload = pointPayload({ nomor_urut, nama_titik, merk, model_cctv, jenis, tipe_lokasi, resolusi,
          jumlah_kamera: row.jumlah_kamera ?? row['Jumlah Kamera'] ?? 1,
          unit_pengelola: row.unit_pengelola ?? row['Unit Pemilik/Pengelola'],
          kategori: row.kategori ?? row['Kategori CCTV'], fungsi_ai: row.fungsi_ai ?? row['Fungsi AI'],
          keterangan: row.keterangan ?? row['Keterangan'] });
      } catch (error) {
        errors.push(`Baris ${rowNumber}: ${error.message}`);
        continue;
      }
      await CCTVPoint.create({
        station_id,
        ...payload,
      }, { transaction });
      
      successCount++;
    }

    await transaction.commit();

    res.status(200).json({
      message: 'Proses impor selesai.',
      data: {
        successCount,
        errorCount: errors.length,
        errors
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    next(error);
  }
};
