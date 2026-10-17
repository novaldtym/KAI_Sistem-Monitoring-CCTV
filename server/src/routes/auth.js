const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { REVIEW_ROLES } = require('../policies/roles');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.patch('/password', authenticate, authController.changePassword);
router.get('/officers', authenticate, authorize(...REVIEW_ROLES), authController.getOfficers);

module.exports = router;
