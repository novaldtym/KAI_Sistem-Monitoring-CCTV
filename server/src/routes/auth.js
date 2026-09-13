const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.get('/officers', authenticate, authController.getOfficers);

module.exports = router;
