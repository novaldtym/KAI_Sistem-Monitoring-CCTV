const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalLog = sequelize.define('ApprovalLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  report_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('approved', 'rejected'),
    allowNull: false,
  },
  komentar: {
    type: DataTypes.TEXT,
  },
  approved_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'approval_logs',
  timestamps: false,
});

module.exports = ApprovalLog;
