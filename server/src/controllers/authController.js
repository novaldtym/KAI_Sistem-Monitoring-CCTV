const jwt = require('jsonwebtoken');
const { sequelize, User } = require('../models');
const { validatePassword, badRequest } = require('../services/userValidation');

exports.login = async (req, res, next) => {
  try {
    const { nipp, password } = req.body;
    if (typeof nipp !== 'string' || typeof password !== 'string' || !nipp.trim() || !password || nipp.length > 20 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ message: 'Username/NIPP dan password wajib diisi dengan benar.' });
    }

    const user = await User.findOne({ where: { nipp: nipp.trim(), is_active: true } });
    if (!user) {
      return res.status(401).json({ message: 'NIPP atau password salah.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'NIPP atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, nipp: user.nipp, role: user.role, tokenVersion: user.token_version },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      message: 'Login berhasil.',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    if (typeof current_password !== 'string' || Buffer.byteLength(current_password, 'utf8') > 72) throw badRequest('Password saat ini wajib diisi.');
    validatePassword(new_password);
    if (new_password !== confirm_password) throw badRequest('Konfirmasi password baru tidak sama.');
    if (current_password === new_password) throw badRequest('Password baru harus berbeda dari password saat ini.');
    await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user?.is_active || user.token_version !== req.user.token_version) {
        throw Object.assign(new Error('Sesi sudah tidak berlaku. Silakan login kembali.'), { statusCode: 401 });
      }
      if (!await user.comparePassword(current_password)) throw badRequest('Password saat ini salah.');
      await user.update({ password_hash: new_password, token_version: user.token_version + 1 }, { transaction });
    });
    res.json({ message: 'Password berhasil diganti. Silakan login kembali dengan password baru.' });
  } catch (error) { next(error); }
};

exports.getOfficers = async (req, res, next) => {
  try {
    const officers = await User.findAll({
      where: { role: 'petugas', is_active: true },
      attributes: ['id', 'nipp', 'nama'],
      order: [['nama', 'ASC']],
    });
    res.json({ data: officers });
  } catch (error) {
    next(error);
  }
};

