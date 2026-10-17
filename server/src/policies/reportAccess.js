const { REVIEW_ROLES } = require('./roles');

const ownsReport = (user, report) =>
  user.role === 'petugas' && report.created_by === user.id;

const canReadReport = (user, report) =>
  REVIEW_ROLES.includes(user.role) || ownsReport(user, report);

module.exports = { ownsReport, canReadReport };
