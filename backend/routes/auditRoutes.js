const express = require('express');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/audit/:fileId — get full audit trail for a document
router.get('/:fileId', protect, async (req, res) => {
  try {
    const logs = await AuditLog.find({ document: req.params.fileId })
      .sort({ createdAt: 1 }); // oldest first (chronological)
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;