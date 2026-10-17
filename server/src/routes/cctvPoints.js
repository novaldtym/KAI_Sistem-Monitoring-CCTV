const router = require('express').Router();
const multer = require('multer');
const cctvPointController = require('../controllers/cctvPointController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.get('/station/:stationId', cctvPointController.getByStation);
router.post('/', authorize('admin'), cctvPointController.create);
router.post('/import', authorize('admin'), upload.single('file'), cctvPointController.importCCTVPoints);
router.put('/:id', authorize('admin'), cctvPointController.update);
router.patch('/reorder', authorize('admin'), cctvPointController.reorder);
router.delete('/:id', authorize('admin'), cctvPointController.remove);

module.exports = router;
