const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Station = sequelize.define('Station', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nama_stasiun: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  business_area: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: null,
  },
  kode_stasiun: {
    type: DataTypes.STRING(10),
  },
  wilayah: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  hari_mulai_m1: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 1, max: 28 },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'stations',
});

module.exports = Station;
