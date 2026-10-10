const { Station, CCTVPoint, sequelize } = require('../models');
const xlsx = require('xlsx');
const { deleteStation } = require('../services/masterDeletion');

exports.getAll = async (req, res, next) => {
  try {
    const stations = await Station.findAll({
      where: { is_active: true },
      include: [{ model: CCTVPoint, as: 'cctvPoints', where: { is_active: true }, required: false }],
      order: [['nama_stasiun', 'ASC']],
    });
    res.json({ data: stations.map((station) => ({ ...station.toJSON(),
      jumlah_kelompok: station.cctvPoints.length,
      jumlah_kamera: station.cctvPoints.reduce((sum, point) => sum + point.jumlah_kamera, 0),
    })) });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const station = await Station.findByPk(req.params.id, {
      include: [{ model: CCTVPoint, as: 'cctvPoints', where: { is_active: true }, required: false, order: [['nomor_urut', 'ASC']] }],
    });
    if (!station) return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });
    res.json({ data: { ...station.toJSON(), jumlah_kelompok: station.cctvPoints.length,
      jumlah_kamera: station.cctvPoints.reduce((sum, point) => sum + point.jumlah_kamera, 0) } });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { nama_stasiun, kode_stasiun, hari_mulai_m1, wilayah } = req.body;
    const station = await Station.create({ nama_stasiun, kode_stasiun, hari_mulai_m1, wilayah });
    res.status(201).json({ message: 'Stasiun berhasil ditambahkan.', data: station });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });
    
    const { nama_stasiun, kode_stasiun, hari_mulai_m1, wilayah } = req.body;
    await station.update({ nama_stasiun, kode_stasiun, hari_mulai_m1, wilayah });
    res.json({ message: 'Stasiun berhasil diupdate.', data: station });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await deleteStation(req.params.id);
    res.json({ message: 'Stasiun dan seluruh titik CCTV-nya berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

exports.importStations = async (req, res, next) => {
  let transaction;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
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
      
      const nama_stasiun = row.nama_stasiun || row['Nama Stasiun'];
      const kode_stasiun = row.kode_stasiun || row['Kode Stasiun'];
      const hari_mulai_m1 = row.hari_mulai_m1 || row['Hari Mulai M1'] || 1;

      if (!nama_stasiun) {
        errors.push(`Baris ${rowNumber}: nama_stasiun wajib diisi.`);
        continue;
      }

      if (kode_stasiun) {
        const existing = await Station.findOne({ where: { kode_stasiun }, transaction });
        if (existing) {
          errors.push(`Baris ${rowNumber}: Kode stasiun ${kode_stasiun} sudah terdaftar.`);
          continue;
        }
      }

      await Station.create({
        nama_stasiun,
        kode_stasiun,
        hari_mulai_m1: parseInt(hari_mulai_m1) || 1,
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
