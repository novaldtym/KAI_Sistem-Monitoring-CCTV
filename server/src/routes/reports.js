const router = require('express').Router();
const reportController = require('../controllers/reportController');
const pdfService = require('../services/pdfService');
const { authenticate, authorize } = require('../middleware/auth');
const { MonitoringReport, MonitoringDetail, CCTVPoint, Station, User, ApprovalLog } = require('../models');

router.use(authenticate);

router.get('/', reportController.getAll);
router.get('/:id', reportController.getById);
router.post('/', authorize('petugas'), reportController.create);
router.put('/:id', authorize('petugas'), reportController.update);
router.patch('/:id/submit', authorize('petugas'), reportController.submit);
router.patch('/:id/approve', authorize('assistant_manager'), reportController.approve);
router.patch('/:id/reject', authorize('assistant_manager'), reportController.reject);

// PDF Generation
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const report = await MonitoringReport.findByPk(req.params.id, {
      include: [
        { model: Station, as: 'station' },
        { model: User, as: 'createdBy', attributes: ['id', 'nama', 'nipp', 'jabatan'] },
        {
          model: MonitoringDetail, as: 'details',
          include: [{ model: CCTVPoint, as: 'cctvPoint' }],
        },
        {
          model: ApprovalLog, as: 'approvalLogs', where: { action: 'approved' },
          include: [{ model: User, as: 'approver', attributes: ['id', 'nama', 'nipp', 'jabatan'] }],
          required: false,
        },
      ],
    });

    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    const pdfBuffer = await pdfService.generateMonitoringPDF(report.toJSON());
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Monitoring_CCTV_${report.station?.nama_stasiun}_${report.bulan}_${report.tahun}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
