const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ROLES } = require('../policies/roles');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active || !ROLES.includes(user.role)) {
      return res.status(401).json({ message: 'User tidak ditemukan atau nonaktif.' });
    }

    if ((decoded.tokenVersion ?? 0) !== user.token_version) {
      return res.status(401).json({ message: 'Sesi sudah tidak berlaku. Silakan login kembali.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token kedaluwarsa. Silakan login kembali.' });
    }
    return res.status(401).json({ message: 'Token tidak valid.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk fitur ini.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
