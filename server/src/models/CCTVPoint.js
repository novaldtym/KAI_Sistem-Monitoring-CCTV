const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { CCTV_TYPES } = require('../constants/cctv');

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
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: { isIn: [CCTV_TYPES] },
  },
  jumlah_kamera: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { isInt: true, min: 1 },
  },
  unit_pengelola: {
    type: DataTypes.STRING(100),
  },
  kategori: {
    type: DataTypes.STRING(100),
  },
  fungsi_ai: {
    type: DataTypes.STRING(255),
  },
  keterangan: {
    type: DataTypes.TEXT,
  },
  import_key: {
    type: DataTypes.STRING(64),
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
    {
      unique: true,
      fields: ['import_key'],
      name: 'uq_cctv_import_key',
    },
  ],
});

module.exports = CCTVPoint;
