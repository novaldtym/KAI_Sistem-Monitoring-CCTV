const { CCTVPoint, Station } = require('../models');

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
    const { station_id, nomor_urut, nama_titik } = req.body;
    const station = await Station.findByPk(station_id);
    if (!station) return res.status(404).json({ message: 'Stasiun tidak ditemukan.' });

    const point = await CCTVPoint.create({ station_id, nomor_urut, nama_titik });
    res.status(201).json({ message: 'Titik CCTV berhasil ditambahkan.', data: point });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const point = await CCTVPoint.findByPk(req.params.id);
    if (!point) return res.status(404).json({ message: 'Titik CCTV tidak ditemukan.' });

    const { nama_titik, nomor_urut } = req.body;
    await point.update({ nama_titik, nomor_urut });
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
