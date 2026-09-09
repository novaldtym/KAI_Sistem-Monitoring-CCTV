const { MonitoringReport, Station } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getSummary = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'petugas') {
      where.created_by = req.user.id;
    }

    const [draft, submitted, approved, rejected] = await Promise.all([
      MonitoringReport.count({ where: { ...where, status: 'draft' } }),
      MonitoringReport.count({ where: { ...where, status: 'submitted' } }),
      MonitoringReport.count({ where: { ...where, status: 'approved' } }),
      MonitoringReport.count({ where: { ...where, status: 'rejected' } }),
    ]);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Stations without report this month
    const allStations = await Station.findAll({ where: { is_active: true }, attributes: ['id', 'nama_stasiun'] });
    const reportedStations = await MonitoringReport.findAll({
      where: { bulan: currentMonth, tahun: currentYear },
      attributes: ['station_id'],
    });
    const reportedIds = reportedStations.map((r) => r.station_id);
    const unreported = allStations.filter((s) => !reportedIds.includes(s.id));

    res.json({
      data: {
        counts: { draft, submitted, approved, rejected, total: draft + submitted + approved + rejected },
        unreportedStations: unreported,
        currentPeriod: { bulan: currentMonth, tahun: currentYear },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingCount = async (req, res, next) => {
  try {
    const count = await MonitoringReport.count({ where: { status: 'submitted' } });
    res.json({ data: { pendingCount: count } });
  } catch (error) {
    next(error);
  }
};
