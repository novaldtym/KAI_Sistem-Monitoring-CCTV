const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportReferenceCounter = sequelize.define('ReportReferenceCounter', {
  tahun: { type: DataTypes.SMALLINT, primaryKey: true, allowNull: false },
  bulan: { type: DataTypes.TINYINT, primaryKey: true, allowNull: false },
  last_number: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'report_reference_counters',
  timestamps: false,
});

module.exports = ReportReferenceCounter;
