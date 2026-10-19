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
    validate: { isInt: true, min: 1, max: 12 },
  },
  tahun: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: { isInt: true, min: 1900, max: 9999 },
  },
  no_ref: {
    type: DataTypes.STRING(40),
  },
  calendar_scheme: {
    type: DataTypes.ENUM('fixed_dates', 'monday'),
    allowNull: false,
    // Existing reports keep their original week assignments when this column is added.
    defaultValue: 'fixed_dates',
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
  tanggal_m5: {
    type: DataTypes.DATEONLY,
  },
  checked_at_m1: {
    type: DataTypes.DATEONLY,
  },
  checked_at_m2: {
    type: DataTypes.DATEONLY,
  },
  checked_at_m3: {
    type: DataTypes.DATEONLY,
  },
  checked_at_m4: {
    type: DataTypes.DATEONLY,
  },
  checked_at_m5: {
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
