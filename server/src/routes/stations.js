const router = require('express').Router();
const multer = require('multer');
const stationController = require('../controllers/stationController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.get('/', stationController.getAll);
router.get('/:id', stationController.getById);
router.post('/', authorize('assistant_manager'), stationController.create);
router.post('/import', authorize('assistant_manager'), upload.single('file'), stationController.importStations);
router.put('/:id', authorize('assistant_manager'), stationController.update);
router.delete('/:id', authorize('assistant_manager'), stationController.remove);

module.exports = router;
