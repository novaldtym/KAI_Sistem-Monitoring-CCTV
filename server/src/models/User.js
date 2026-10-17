const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../policies/roles');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nipp: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...ROLES),
    allowNull: false,
  },
  jabatan: {
    type: DataTypes.STRING(100),
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  token_version: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['nipp'],
      name: 'uq_users_nipp',
    },
    {
      unique: true,
      fields: ['email'],
      name: 'uq_users_email',
    },
  ],
});

// Hash password before save
User.beforeSave(async (user) => {
  if (user.changed('password_hash') && user.password_hash) {
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
  delete values.token_version;
  return values;
};

module.exports = User;
