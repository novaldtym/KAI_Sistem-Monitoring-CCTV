const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CCTVPoint = sequelize.define('CCTVPoint', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nomor_urut: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nama_titik: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'cctv_points',
  indexes: [
    {
      unique: true,
      fields: ['station_id', 'nomor_urut'],
      name: 'uq_station_nomor',
    },
  ],
});

module.exports = CCTVPoint;
