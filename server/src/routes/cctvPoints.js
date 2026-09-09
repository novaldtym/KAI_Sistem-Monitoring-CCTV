const router = require('express').Router();
const cctvPointController = require('../controllers/cctvPointController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/station/:stationId', cctvPointController.getByStation);
router.post('/', authorize('assistant_manager'), cctvPointController.create);
router.put('/:id', authorize('assistant_manager'), cctvPointController.update);
router.patch('/reorder', authorize('assistant_manager'), cctvPointController.reorder);
router.delete('/:id', authorize('assistant_manager'), cctvPointController.remove);

module.exports = router;
