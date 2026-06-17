const AuditLog = require('../models/AuditLog');

// Call this function anywhere to log an action
async function logAction(documentId, action, actor, req, details = '') {
  try {
    await AuditLog.create({
      document: documentId,
      action,
      actor,
      ipAddress: req.ip || req.connection.remoteAddress,
      details
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
    // Don't crash the app if logging fails
  }
}

module.exports = { logAction };