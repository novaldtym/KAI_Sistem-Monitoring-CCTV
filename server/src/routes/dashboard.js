const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { REVIEW_ROLES, REPORT_ROLES } = require('../policies/roles');

router.use(authenticate);
router.get('/summary', dashboardController.getSummary);
router.get('/inspection', authorize(...REPORT_ROLES), dashboardController.getInspection);
router.get('/pending-count', authorize(...REVIEW_ROLES), dashboardController.getPendingCount);

module.exports = router;
