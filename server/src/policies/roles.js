const ROLES = Object.freeze(['manager', 'assistant_manager', 'petugas', 'admin']);
const REVIEW_ROLES = Object.freeze(['manager', 'assistant_manager']);
const REPORT_ROLES = Object.freeze([...REVIEW_ROLES, 'petugas']);

module.exports = { ROLES, REVIEW_ROLES, REPORT_ROLES };
