const router = require('express').Router();
const stationController = require('../controllers/stationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', stationController.getAll);
router.get('/:id', stationController.getById);
router.post('/', authorize('assistant_manager'), stationController.create);
router.put('/:id', authorize('assistant_manager'), stationController.update);
router.delete('/:id', authorize('assistant_manager'), stationController.remove);

module.exports = router;
