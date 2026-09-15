const { CCTVPoint, Station, sequelize } = require('../models');
const xlsx = require('xlsx');


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
    const { station_id, nomor_urut, nama_titik, merk, model_cctv, jenis, tipe_lokasi, resolusi } = req.body;
    const station = await Station.findByPk(station_id);
    if (!station) return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });

    const point = await CCTVPoint.create({ 
      station_id, nomor_urut, nama_titik, merk, model_cctv, jenis, tipe_lokasi, resolusi 
    });
    res.status(201).json({ message: 'Titik CCTV berhasil ditambahkan.', data: point });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const point = await CCTVPoint.findByPk(req.params.id);
    if (!point) return res.status(404).json({ message: 'Titik CCTV tidak ditemukan.' });

    const { nama_titik, nomor_urut, merk, model_cctv, jenis, tipe_lokasi, resolusi } = req.body;
    await point.update({ nama_titik, nomor_urut, merk, model_cctv, jenis, tipe_lokasi, resolusi });
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
    const point = await CCTVPoint.findByPk(req.params.id);
    if (!point) return res.status(404).json({ message: 'Titik CCTV tidak ditemukan.' });

    await point.update({ is_active: false });
    res.json({ message: 'Titik CCTV berhasil dinonaktifkan.' });
  } catch (error) {
    next(error);
  }
};

exports.importCCTVPoints = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    }

    const { station_id } = req.body;
    if (!station_id) {
      return res.status(400).json({ message: 'station_id wajib dikirim.' });
    }

    const station = await Station.findByPk(station_id, { transaction });
    if (!station) {
      return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let successCount = 0;
    let errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; 
      
      const nomor_urut = row.nomor_urut || row['Nomor Urut'];
      const nama_titik = row.nama_titik || row['Nama Titik'];
      const merk = row.merk || row['Merk'] || null;
      const model_cctv = row.model_cctv || row['Model CCTV'] || null;
      let jenis = (row.jenis || row['Jenis'])?.toLowerCase();
      let tipe_lokasi = (row.tipe_lokasi || row['Lokasi'])?.toLowerCase();
      const resolusi = row.resolusi || row['Resolusi'] || null;

      if (!nomor_urut || !nama_titik) {
        errors.push(`Baris ${rowNumber}: Nomor Urut dan Nama Titik wajib diisi.`);
        continue;
      }

      if (jenis && !['dome', 'bullet', 'ptz', 'box', 'lainnya'].includes(jenis)) {
        jenis = 'lainnya';
      }
      
      if (tipe_lokasi && !['indoor', 'outdoor'].includes(tipe_lokasi)) {
        tipe_lokasi = null;
      }

      const existing = await CCTVPoint.findOne({ where: { station_id, nomor_urut }, transaction });
      if (existing) {
        errors.push(`Baris ${rowNumber}: Nomor Urut ${nomor_urut} sudah ada di stasiun ini.`);
        continue;
      }

      await CCTVPoint.create({
        station_id,
        nomor_urut: parseInt(nomor_urut),
        nama_titik,
        merk,
        model_cctv,
        jenis,
        tipe_lokasi,
        resolusi
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
