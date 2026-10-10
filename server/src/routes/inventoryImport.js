const router = require('express').Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/inventoryImportController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!/\.(xlsx|xls)$/i.test(file.originalname)) return callback(new Error('Gunakan file Excel .xlsx atau .xls.'));
    callback(null, true);
  },
}).single('file');

router.use(authenticate, authorize('assistant_manager'));
router.use((req, res, next) => upload(req, res, (error) => {
  if (!error) return next();
  res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
    message: error.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file maksimal 10 MB.' : error.message,
  });
}));
router.post('/preview', controller.preview);
router.post('/', controller.import);

module.exports = router;
