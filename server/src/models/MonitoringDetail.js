const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonitoringDetail = sequelize.define('MonitoringDetail', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  report_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cctv_point_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  m1_berfungsi: {
    type: DataTypes.ENUM('V', 'X', '-'),
    defaultValue: '-',
  },
  m1_terbackup: {
    type: DataTypes.ENUM('V', 'X', '-'),
    defaultValue: '-',
  },
  m2_berfungsi: {
    type: DataTypes.ENUM('V', 'X', '-'),
    defaultValue: '-',
  },
  m2_terbackup: {
    type: DataTypes.ENUM('V', 'X', '-'),
    defaultValue: '-',
  },
  m3_berfungsi: {
    type: DataTypes.ENUM('V', 'X', '-'),
    defaultValue: '-',
  },
  m3_terbackup: {
    type: DataTypes.ENUM('V', 'X', '-'),
    defaultValue: '-',
  },
  m4_berfungsi: {
    type: DataTypes.ENUM('V', 'X', '-'),
    defaultValue: '-',
  },
  m4_terbackup: {
    type: DataTypes.ENUM('V', 'X', '-'),
    defaultValue: '-',
  },
}, {
  tableName: 'monitoring_details',
  indexes: [
    {
      unique: true,
      fields: ['report_id', 'cctv_point_id'],
      name: 'uq_detail',
    },
  ],
});

module.exports = MonitoringDetail;
