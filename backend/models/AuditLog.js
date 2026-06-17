const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  action: String,    // e.g. 'uploaded', 'viewed', 'signed', 'rejected'
  actor: String,     // email or name of who did it
  ipAddress: String, // their IP address
  details: String    // any extra info
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditSchema);