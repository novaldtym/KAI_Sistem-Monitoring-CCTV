const { Op } = require('sequelize');
const { sequelize, Station, CCTVPoint, MonitoringReport, MonitoringDetail } = require('../models');

const failure = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const stationInUse = 'Stasiun tidak dapat dihapus karena stasiun atau titik CCTV-nya sudah digunakan dalam laporan.';
const pointInUse = 'Titik CCTV tidak dapat dihapus karena sudah digunakan dalam laporan.';

async function deleteStation(id) {
  try {
    await sequelize.transaction(async (transaction) => {
      const station = await Station.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!station) throw failure('Stasiun tidak ditemukan.', 404);
      const points = await CCTVPoint.findAll({ where: { station_id: station.id }, attributes: ['id'],
        transaction, lock: transaction.LOCK.UPDATE });
      const report = await MonitoringReport.findOne({ where: { station_id: station.id }, attributes: ['id'], transaction });
      const detail = points.length ? await MonitoringDetail.findOne({
        where: { cctv_point_id: { [Op.in]: points.map((point) => point.id) } }, attributes: ['id'], transaction,
      }) : null;
      if (report || detail) throw failure(stationInUse, 409);
      await CCTVPoint.destroy({ where: { station_id: station.id }, transaction });
      await station.destroy({ transaction });
    });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') throw failure(stationInUse, 409);
    throw error;
  }
}

async function deleteCCTVPoint(id) {
  try {
    await sequelize.transaction(async (transaction) => {
      const point = await CCTVPoint.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!point) throw failure('Titik CCTV tidak ditemukan.', 404);
      const detail = await MonitoringDetail.findOne({ where: { cctv_point_id: point.id }, attributes: ['id'], transaction });
      if (detail) throw failure(pointInUse, 409);
      await point.destroy({ transaction });
    });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') throw failure(pointInUse, 409);
    throw error;
  }
}

module.exports = { deleteStation, deleteCCTVPoint };
