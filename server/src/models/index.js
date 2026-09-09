const sequelize = require('../config/database');
const User = require('./User');
const Station = require('./Station');
const CCTVPoint = require('./CCTVPoint');
const MonitoringReport = require('./MonitoringReport');
const MonitoringDetail = require('./MonitoringDetail');
const ApprovalLog = require('./ApprovalLog');

// --- Associations ---

// Station <-> CCTVPoint
Station.hasMany(CCTVPoint, { foreignKey: 'station_id', as: 'cctvPoints' });
CCTVPoint.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

// Station <-> MonitoringReport
Station.hasMany(MonitoringReport, { foreignKey: 'station_id', as: 'reports' });
MonitoringReport.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

// User (Petugas) <-> MonitoringReport
User.hasMany(MonitoringReport, { foreignKey: 'created_by', as: 'reports' });
MonitoringReport.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });

// MonitoringReport <-> MonitoringDetail
MonitoringReport.hasMany(MonitoringDetail, { foreignKey: 'report_id', as: 'details' });
MonitoringDetail.belongsTo(MonitoringReport, { foreignKey: 'report_id', as: 'report' });

// CCTVPoint <-> MonitoringDetail
CCTVPoint.hasMany(MonitoringDetail, { foreignKey: 'cctv_point_id', as: 'monitoringDetails' });
MonitoringDetail.belongsTo(CCTVPoint, { foreignKey: 'cctv_point_id', as: 'cctvPoint' });

// MonitoringReport <-> ApprovalLog
MonitoringReport.hasMany(ApprovalLog, { foreignKey: 'report_id', as: 'approvalLogs' });
ApprovalLog.belongsTo(MonitoringReport, { foreignKey: 'report_id', as: 'report' });

// User (Manager) <-> ApprovalLog
User.hasMany(ApprovalLog, { foreignKey: 'approved_by', as: 'approvalsMade' });
ApprovalLog.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

module.exports = {
  sequelize,
  User,
  Station,
  CCTVPoint,
  MonitoringReport,
  MonitoringDetail,
  ApprovalLog,
};
