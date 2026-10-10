const { getCalendar, getReportCalendar, currentInspectionPeriod, scheduleFields, reportCalendarData, validateStatusChanges, checkedFields, validateClientDates, badRequest } = require('../services/reportCalendar');
const { ownsReport, canReadReport } = require('../policies/reportAccess');
const { sequelize, MonitoringReport, MonitoringDetail, CCTVPoint, Station, User, ApprovalLog } = require('../models');
const { allocateReportReference } = require('../services/reportReference');

exports.getAll = async (req, res, next) => {
  try {
    const { bulan, tahun, station_id, status, page = 1, limit = 10, created_by } = req.query;
    const where = {};
    
    if (bulan) where.bulan = bulan;
    if (tahun) where.tahun = tahun;
    if (station_id) where.station_id = station_id;
    if (status) where.status = status;
    
    // Petugas only sees own reports
    if (req.user.role === 'petugas') {
      where.created_by = req.user.id;
    } else if (created_by) {
      where.created_by = created_by;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await MonitoringReport.findAndCountAll({
      where,
      include: [
        { model: Station, as: 'station', attributes: ['id', 'nama_stasiun'] },
        { model: User, as: 'createdBy', attributes: ['id', 'nama', 'nipp'] },
      ],
      order: [['tahun', 'DESC'], ['bulan', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const report = await MonitoringReport.findByPk(req.params.id, {
      include: [
        { model: Station, as: 'station' },
        { model: User, as: 'createdBy', attributes: ['id', 'nama', 'nipp', 'jabatan'] },
        {
          model: MonitoringDetail, as: 'details',
          include: [{ model: CCTVPoint, as: 'cctvPoint', attributes: ['id', 'nomor_urut', 'nama_titik', 'jumlah_kamera', 'unit_pengelola'] }],
        },
        {
          model: ApprovalLog, as: 'approvalLogs',
          include: [{ model: User, as: 'approver', attributes: ['id', 'nama', 'nipp', 'jabatan'] }],
          order: [['approved_at', 'DESC']],
        },
      ],
    });

    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    if (!canReadReport(req.user, report)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke laporan ini.' });
    }

    // Sort details by nomor_urut
    const data = report.toJSON();
    if (data.details) {
      data.details.sort((a, b) => (a.cctvPoint?.nomor_urut || 0) - (b.cctvPoint?.nomor_urut || 0));
    }

    data.calendar = reportCalendarData(data);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

exports.calendar = async (req, res, next) => {
  try {
    if (req.query.report_id !== undefined) {
      if (!Number.isInteger(Number(req.query.report_id)) || Number(req.query.report_id) < 1) throw badRequest('ID laporan tidak valid.');
      const report = await MonitoringReport.findByPk(req.query.report_id);
      if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
      if (!canReadReport(req.user, report)) return res.status(403).json({ message: 'Anda tidak memiliki akses ke laporan ini.' });
      return res.json({ data: reportCalendarData(report) });
    }
    const period = currentInspectionPeriod();
    res.json({ data: getCalendar(req.query.bulan ?? period.bulan, req.query.tahun ?? period.tahun) });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { station_id, bulan, tahun, catatan, details } = req.body;
    const calendar = getCalendar(bulan, tahun);
    if (!Number.isInteger(Number(station_id)) || Number(station_id) < 1) throw badRequest('Pilih stasiun yang valid.');
    const reportId = await sequelize.transaction(async (transaction) => {
      const station = await Station.findByPk(station_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!station || !station.is_active) throw badRequest('Stasiun tidak ditemukan atau nonaktif.');
      const existing = await MonitoringReport.findOne({ where: { station_id, bulan: calendar.bulan, tahun: calendar.tahun }, transaction });
      if (existing) throw Object.assign(new Error('Laporan untuk stasiun, bulan, dan tahun ini sudah ada.'), { statusCode: 409 });
      const points = await CCTVPoint.findAll({ where: { station_id, is_active: true }, order: [['nomor_urut', 'ASC']], transaction });
      if (!points.length) throw badRequest('Stasiun ini belum memiliki kelompok CCTV aktif.');
      const initialDetails = points.map((point) => ({ cctv_point_id: point.id }));
      const schedule = scheduleFields(calendar);
      validateClientDates(req.body, schedule);
      const changes = validateStatusChanges(details, initialDetails, calendar);
      const changedById = new Map(changes.map((item) => [item.cctv_point_id, item.changes]));
      const no_ref = await allocateReportReference(calendar.bulan, calendar.tahun, transaction);
      const report = await MonitoringReport.create({ station_id, bulan: calendar.bulan, tahun: calendar.tahun,
        calendar_scheme: 'monday', no_ref, catatan, ...schedule, ...checkedFields(changes, calendar), status: 'draft', created_by: req.user.id }, { transaction });
      await MonitoringDetail.bulkCreate(initialDetails.map((detail) => ({
        ...detail, report_id: report.id, ...changedById.get(detail.cctv_point_id),
      })), { transaction, validate: true });
      return report.id;
    });
    const created = await MonitoringReport.findByPk(reportId, { include: [
      { model: Station, as: 'station' },
      { model: MonitoringDetail, as: 'details', include: [{ model: CCTVPoint, as: 'cctvPoint' }] },
    ] });
    const data = created.toJSON();
    data.calendar = reportCalendarData(data);
    res.status(201).json({ message: 'Laporan berhasil dibuat.', data });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    await sequelize.transaction(async (transaction) => {
      const report = await MonitoringReport.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!report) throw Object.assign(new Error('Laporan tidak ditemukan.'), { statusCode: 404 });
      if (!ownsReport(req.user, report)) throw Object.assign(new Error('Anda hanya bisa mengedit laporan milik Anda.'), { statusCode: 403 });
      if (!['draft', 'rejected'].includes(report.status)) throw badRequest('Hanya laporan draft atau rejected yang bisa diedit.');
      if (req.body.no_ref !== undefined && req.body.no_ref !== report.no_ref) {
        throw badRequest('Nomor referensi ditentukan otomatis dan tidak dapat diubah.');
      }
      for (const field of ['station_id', 'bulan', 'tahun']) {
        if (req.body[field] !== undefined && Number(req.body[field]) !== report[field]) throw badRequest('Stasiun dan periode laporan tidak dapat diubah.');
      }
      const calendar = getReportCalendar(report);
      const existingDetails = await MonitoringDetail.findAll({ where: { report_id: report.id }, transaction, lock: transaction.LOCK.UPDATE });
      validateClientDates(req.body, report);
      const changes = validateStatusChanges(req.body.details, existingDetails, calendar);
      for (const detail of changes) {
        await MonitoringDetail.update(detail.changes, { where: { report_id: report.id, cctv_point_id: detail.cctv_point_id }, transaction });
      }
      await report.update({ catatan: req.body.catatan, ...checkedFields(changes, calendar) }, { transaction });
    });
    res.json({ message: 'Laporan berhasil diupdate.' });
  } catch (error) {
    next(error);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const report = await MonitoringReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    if (!ownsReport(req.user, report)) {
      return res.status(403).json({ message: 'Anda hanya bisa men-submit laporan milik Anda.' });
    }
    if (!['draft', 'rejected'].includes(report.status)) {
      return res.status(400).json({ message: 'Laporan ini tidak bisa di-submit.' });
    }
    await report.update({ status: 'submitted' });
    res.json({ message: 'Laporan berhasil di-submit untuk review.' });
  } catch (error) {
    next(error);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const report = await MonitoringReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    if (report.status !== 'submitted') {
      return res.status(400).json({ message: 'Hanya laporan berstatus submitted yang bisa di-approve.' });
    }

    await report.update({ status: 'approved' });
    await ApprovalLog.create({
      report_id: report.id, approved_by: req.user.id,
      action: 'approved', komentar: req.body.komentar || null,
    });

    res.json({ message: 'Laporan berhasil di-approve.' });
  } catch (error) {
    next(error);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const report = await MonitoringReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    if (report.status !== 'submitted') {
      return res.status(400).json({ message: 'Hanya laporan berstatus submitted yang bisa di-reject.' });
    }
    if (!req.body.komentar) {
      return res.status(400).json({ message: 'Komentar alasan penolakan wajib diisi.' });
    }

    await report.update({ status: 'rejected' });
    await ApprovalLog.create({
      report_id: report.id, approved_by: req.user.id,
      action: 'rejected', komentar: req.body.komentar,
    });

    res.json({ message: 'Laporan berhasil di-reject.' });
  } catch (error) {
    next(error);
  }
};
