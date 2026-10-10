const { planImport, previewData, importInventory } = require('../services/inventoryImportService');

exports.preview = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Pilih file Excel terlebih dahulu.' });
    const plan = await planImport(req.file.buffer);
    res.json({ data: previewData(plan) });
  } catch (error) {
    next(error);
  }
};

exports.import = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Pilih file Excel terlebih dahulu.' });
    const data = await importInventory(req.file.buffer, req.body.fingerprint);
    res.json({ message: 'Data stasiun dan kelompok CCTV berhasil diimpor.', data });
  } catch (error) {
    next(error);
  }
};
