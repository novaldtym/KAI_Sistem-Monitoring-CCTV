const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.login = async (req, res, next) => {
  try {
    const { nipp, password } = req.body;
    if (!nipp || !password) {
      return res.status(400).json({ message: 'NIPP dan password wajib diisi.' });
    }

    const user = await User.findOne({ where: { nipp, is_active: true } });
    if (!user) {
      return res.status(401).json({ message: 'NIPP atau password salah.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'NIPP atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, nipp: user.nipp, role: user.role },
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

