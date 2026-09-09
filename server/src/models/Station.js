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
    allowNull: false,
  },
  kode_stasiun: {
    type: DataTypes.STRING(10),
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'stations',
});

module.exports = Station;
