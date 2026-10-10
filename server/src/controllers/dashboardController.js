const { MonitoringReport } = require('../models');
const { jakartaDate } = require('../services/reportCalendar');
const { getStationInspection } = require('../services/stationInspection');

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

    const [currentYear, currentMonth] = jakartaDate().split('-').map(Number);

    res.json({
      data: {
        counts: { draft, submitted, approved, rejected, total: draft + submitted + approved + rejected },
        currentPeriod: { bulan: currentMonth, tahun: currentYear },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getInspection = async (req, res, next) => {
  try {
    res.json({ data: await getStationInspection(req.query, req.user) });
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
