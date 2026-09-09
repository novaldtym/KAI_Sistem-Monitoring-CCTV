const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonitoringReport = sequelize.define('MonitoringReport', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bulan: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
  tahun: {
    type: DataTypes.SMALLINT,
    allowNull: false,
  },
  no_ref: {
    type: DataTypes.STRING(20),
  },
  tanggal_m1: {
    type: DataTypes.DATEONLY,
  },
  tanggal_m2: {
    type: DataTypes.DATEONLY,
  },
  tanggal_m3: {
    type: DataTypes.DATEONLY,
  },
  tanggal_m4: {
    type: DataTypes.DATEONLY,
  },
  catatan: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
    defaultValue: 'draft',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'monitoring_reports',
  indexes: [
    {
      unique: true,
      fields: ['station_id', 'bulan', 'tahun'],
      name: 'uq_report_period',
    },
  ],
});

module.exports = MonitoringReport;
