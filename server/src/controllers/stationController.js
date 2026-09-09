const { Station, CCTVPoint } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const stations = await Station.findAll({
      where: { is_active: true },
      include: [{ model: CCTVPoint, as: 'cctvPoints', where: { is_active: true }, required: false }],
      order: [['nama_stasiun', 'ASC']],
    });
    res.json({ data: stations });
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
    res.json({ data: station });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { nama_stasiun, business_area, kode_stasiun } = req.body;
    const station = await Station.create({ nama_stasiun, business_area, kode_stasiun });
    res.status(201).json({ message: 'Stasiun berhasil ditambahkan.', data: station });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });
    
    const { nama_stasiun, business_area, kode_stasiun } = req.body;
    await station.update({ nama_stasiun, business_area, kode_stasiun });
    res.json({ message: 'Stasiun berhasil diupdate.', data: station });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });
    
    await station.update({ is_active: false });
    res.json({ message: 'Stasiun berhasil dinonaktifkan.' });
  } catch (error) {
    next(error);
  }
};
