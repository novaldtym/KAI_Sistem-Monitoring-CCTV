const router = require('express').Router();
const multer = require('multer');
const cctvPointController = require('../controllers/cctvPointController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.get('/station/:stationId', cctvPointController.getByStation);
router.post('/', authorize('assistant_manager'), cctvPointController.create);
router.post('/import', authorize('assistant_manager'), upload.single('file'), cctvPointController.importCCTVPoints);
router.put('/:id', authorize('assistant_manager'), cctvPointController.update);
router.patch('/reorder', authorize('assistant_manager'), cctvPointController.reorder);
router.delete('/:id', authorize('assistant_manager'), cctvPointController.remove);

module.exports = router;
