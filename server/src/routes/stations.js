const router = require('express').Router();
const multer = require('multer');
const stationController = require('../controllers/stationController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.get('/', stationController.getAll);
router.get('/:id', stationController.getById);
router.post('/', authorize('admin'), stationController.create);
router.post('/import', authorize('admin'), upload.single('file'), stationController.importStations);
router.put('/:id', authorize('admin'), stationController.update);
router.delete('/:id', authorize('admin'), stationController.remove);

module.exports = router;
