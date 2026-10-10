const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/summary', dashboardController.getSummary);
router.get('/inspection', dashboardController.getInspection);
router.get('/pending-count', dashboardController.getPendingCount);

module.exports = router;
