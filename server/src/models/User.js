const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nipp: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('petugas', 'assistant_manager'),
    allowNull: false,
  },
  jabatan: {
    type: DataTypes.STRING(100),
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
});

// Hash password before save
User.beforeCreate(async (user) => {
  if (user.password_hash) {
    user.password_hash = await bcrypt.hash(user.password_hash, 12);
  }
});

User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

// Hide sensitive fields
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

module.exports = User;
