const { Op } = require('sequelize');
const { ownsReport, canReadReport } = require('../policies/reportAccess');
const { MonitoringReport, MonitoringDetail, CCTVPoint, Station, User, ApprovalLog } = require('../models');

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
        { model: Station, as: 'station', attributes: ['id', 'nama_stasiun', 'business_area'] },
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
          include: [{ model: CCTVPoint, as: 'cctvPoint', attributes: ['id', 'nomor_urut', 'nama_titik'] }],
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
      data.details.sort((a, b) => a.cctvPoint.nomor_urut - b.cctvPoint.nomor_urut);
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { station_id, bulan, tahun, no_ref, tanggal_m1, tanggal_m2, tanggal_m3, tanggal_m4, catatan, details } = req.body;

    // Check duplicate
    const existing = await MonitoringReport.findOne({ where: { station_id, bulan, tahun } });
    if (existing) {
      return res.status(409).json({ message: 'Laporan untuk stasiun, bulan, dan tahun ini sudah ada.' });
    }

    // Create report
    const report = await MonitoringReport.create({
      station_id, bulan, tahun, no_ref, tanggal_m1, tanggal_m2, tanggal_m3, tanggal_m4,
      catatan, status: 'draft', created_by: req.user.id,
    });

    // Create details for each CCTV point
    if (details && details.length > 0) {
      const detailRecords = details.map((d) => ({
        report_id: report.id,
        cctv_point_id: d.cctv_point_id,
        m1_berfungsi: d.m1_berfungsi || '-',
        m1_terbackup: d.m1_terbackup || '-',
        m2_berfungsi: d.m2_berfungsi || '-',
        m2_terbackup: d.m2_terbackup || '-',
        m3_berfungsi: d.m3_berfungsi || '-',
        m3_terbackup: d.m3_terbackup || '-',
        m4_berfungsi: d.m4_berfungsi || '-',
        m4_terbackup: d.m4_terbackup || '-',
      }));
      await MonitoringDetail.bulkCreate(detailRecords);
    } else {
      // Auto-generate details from active CCTV points
      const points = await CCTVPoint.findAll({
        where: { station_id, is_active: true },
        order: [['nomor_urut', 'ASC']],
      });
      const detailRecords = points.map((p) => ({
        report_id: report.id,
        cctv_point_id: p.id,
      }));
      if (detailRecords.length > 0) {
        await MonitoringDetail.bulkCreate(detailRecords);
      }
    }

    const created = await MonitoringReport.findByPk(report.id, {
      include: [
        { model: Station, as: 'station' },
        { model: MonitoringDetail, as: 'details', include: [{ model: CCTVPoint, as: 'cctvPoint' }] },
      ],
    });

    res.status(201).json({ message: 'Laporan berhasil dibuat.', data: created });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const report = await MonitoringReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    if (!['draft', 'rejected'].includes(report.status)) {
      return res.status(400).json({ message: 'Hanya laporan berstatus draft atau rejected yang bisa diedit.' });
    }

    if (report.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Anda hanya bisa mengedit laporan milik Anda.' });
    }

    const { no_ref, tanggal_m1, tanggal_m2, tanggal_m3, tanggal_m4, catatan, details } = req.body;
    await report.update({ no_ref, tanggal_m1, tanggal_m2, tanggal_m3, tanggal_m4, catatan });

    // Update details
    if (details && details.length > 0) {
      for (const d of details) {
        await MonitoringDetail.update(
          {
            m1_berfungsi: d.m1_berfungsi, m1_terbackup: d.m1_terbackup,
            m2_berfungsi: d.m2_berfungsi, m2_terbackup: d.m2_terbackup,
            m3_berfungsi: d.m3_berfungsi, m3_terbackup: d.m3_terbackup,
            m4_berfungsi: d.m4_berfungsi, m4_terbackup: d.m4_terbackup,
          },
          { where: { report_id: report.id, cctv_point_id: d.cctv_point_id } }
        );
      }
    }

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
