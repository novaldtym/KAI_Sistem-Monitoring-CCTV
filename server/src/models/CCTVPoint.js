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
  merk: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  model_cctv: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  jenis: {
    type: DataTypes.ENUM('dome', 'bullet', 'ptz', 'box', 'lainnya'),
    allowNull: true,
  },
  tipe_lokasi: {
    type: DataTypes.ENUM('indoor', 'outdoor'),
    allowNull: true,
  },
  resolusi: {
    type: DataTypes.STRING(20),
    allowNull: true,
  }
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
