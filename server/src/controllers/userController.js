const { sequelize, User, MonitoringReport, ApprovalLog } = require('../models');
const { userFields, badRequest } = require('../services/userValidation');

const conflict = (message) => Object.assign(new Error(message), { statusCode: 409 });
const userId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw badRequest('ID user tidak valid.');
  return id;
};

async function lockAdministrators(req, transaction) {
  const admins = await User.findAll({ where: { role: 'admin', is_active: true }, order: [['id', 'ASC']],
    transaction, lock: transaction.LOCK.UPDATE });
  const actor = admins.find((admin) => admin.id === req.user.id);
  if (!actor || actor.token_version !== req.user.token_version) {
    throw Object.assign(new Error('Akses Admin sudah tidak berlaku. Silakan login kembali.'), { statusCode: 403 });
  }
  return admins;
}

function handleError(error, next) {
  if (error.name === 'SequelizeUniqueConstraintError') return next(conflict('Username/NIPP atau email sudah digunakan.'));
  if (error.name === 'SequelizeForeignKeyConstraintError') return next(conflict('User memiliki riwayat laporan atau approval. Nonaktifkan akun untuk mempertahankan riwayatnya.'));
  next(error);
}

exports.getAll = async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['nama', 'ASC'], ['id', 'ASC']] });
    res.json({ data: users });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const fields = userFields(req.body, true);
    const user = await sequelize.transaction(async (transaction) => {
      await lockAdministrators(req, transaction);
      return User.create(fields, { transaction });
    });
    res.status(201).json({ message: 'User berhasil ditambahkan.', data: user });
  } catch (error) { handleError(error, next); }
};

exports.update = async (req, res, next) => {
  try {
    const id = userId(req.params.id);
    const fields = userFields(req.body);
    const user = await sequelize.transaction(async (transaction) => {
      const admins = await lockAdministrators(req, transaction);
      const target = await User.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!target) throw Object.assign(new Error('User tidak ditemukan.'), { statusCode: 404 });
      const removesAdmin = target.role === 'admin' && target.is_active &&
        ((fields.role !== undefined && fields.role !== 'admin') || fields.is_active === false);
      if (id === req.user.id && removesAdmin) throw conflict('Anda tidak dapat mengubah role atau menonaktifkan akun Admin sendiri.');
      if (removesAdmin && admins.length <= 1) throw conflict('Minimal satu akun Admin harus tetap aktif.');
      const revokesSession = fields.password_hash !== undefined || ['nipp', 'role', 'is_active'].some((key) =>
        fields[key] !== undefined && fields[key] !== target[key]);
      if (revokesSession) fields.token_version = target.token_version + 1;
      return target.update(fields, { transaction });
    });
    res.json({ message: 'User berhasil diperbarui.', data: user });
  } catch (error) { handleError(error, next); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = userId(req.params.id);
    await sequelize.transaction(async (transaction) => {
      const admins = await lockAdministrators(req, transaction);
      if (id === req.user.id) throw conflict('Anda tidak dapat menghapus akun Admin sendiri.');
      const target = await User.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!target) throw Object.assign(new Error('User tidak ditemukan.'), { statusCode: 404 });
      if (target.role === 'admin' && target.is_active && admins.length <= 1) throw conflict('Minimal satu akun Admin harus tetap aktif.');
      const reports = await MonitoringReport.count({ where: { created_by: id }, transaction });
      const approvals = await ApprovalLog.count({ where: { approved_by: id }, transaction });
      if (reports || approvals) throw conflict('User memiliki riwayat laporan atau approval. Nonaktifkan akun untuk mempertahankan riwayatnya.');
      await target.destroy({ transaction });
    });
    res.json({ message: 'User berhasil dihapus.' });
  } catch (error) { handleError(error, next); }
};
