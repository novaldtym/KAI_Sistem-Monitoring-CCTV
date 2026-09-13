const ownsReport = (user, report) =>
  user.role === 'petugas' && report.created_by === user.id;

const canReadReport = (user, report) =>
  user.role === 'assistant_manager' || ownsReport(user, report);

module.exports = { ownsReport, canReadReport };
