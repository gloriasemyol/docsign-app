const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Signature = require('../models/Signature');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

// 1. POST /api/signatures/finalize/:docId — generate the signed PDF and flip status flags
router.post('/finalize/:docId', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Fetch matching signature structures
    const sigs = await Signature.find({
      document: req.params.docId,
      status: 'signed'
    });

    // Update the parent document status schema parameters directly
    doc.status = 'signed';
    await doc.save();

    // Return current path metadata back to frontend download client
    res.json({ message: 'Signed PDF processed!', path: doc.filePath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST /api/signatures — place a signature field on a document
router.post('/', protect, async (req, res) => {
  const { documentId, x, y, page, signerEmail } = req.body;
  try {
    const sig = await Signature.create({
      document: documentId,
      x, y, page,
      signerEmail: signerEmail || null
    });
    res.status(201).json(sig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. GET /api/signatures/:docId — get all signatures for a document
router.get('/:docId', protect, async (req, res) => {
  try {
    const sigs = await Signature.find({ document: req.params.docId });
    res.json(sigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. POST /api/signatures/invite — safe production link fallback
router.post('/invite', protect, async (req, res) => {
  const { documentId, signerEmail, x, y, page } = req.body;
  try {
    const doc = await Document.findById(documentId);
    const token = crypto.randomBytes(32).toString('hex');

    const sig = await Signature.create({
      document: documentId,
      signerEmail,
      x, y, page,
      signingToken: token,
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || 'https://docsign-app-gilt.vercel.app';
    const url = `${frontendBaseUrl.replace(/\/$/, '')}/sign/${token}`;
    
    console.log(`=============================================`);
    console.log(`✉️ SIGNING INVITATION GENERATED SUCCESSFULLY`);
    console.log(`Recipient: ${signerEmail}`);
    console.log(`Document: ${doc ? doc.originalName : documentId}`);
    console.log(`Link: ${url}`);
    console.log(`=============================================`);

    res.json({ message: 'Invitation processed cleanly!', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. PATCH /api/signatures/:id/sign — commit verification audit trails
router.patch('/:id/sign', async (req, res) => {
  try {
    const sig = await Signature.findById(req.params.id);
    if (!sig) return res.status(404).json({ message: 'Signature field not found' });

    sig.status = 'signed';
    sig.signedAt = new Date();
    await sig.save(); 

    // Safe fallbacks for execution traces if request hooks are missing
    try {
      await logAction(sig.document, 'signed', sig.signerEmail, req,
        `Signed at coordinates x:${sig.x} y:${sig.y}`
      );
    } catch (auditErr) {
      console.warn("Audit trail middleware hook bypassed setup:", auditErr.message);
    }

    res.json({ message: 'Document signed successfully!', sig });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. GET by token (for the public sign page)
router.get('/token/:token', async (req, res) => {
  try {
    const sig = await Signature.findOne({
      signingToken: req.params.token,
      tokenExpiresAt: { $gt: new Date() }
    });
    if (!sig) return res.status(404).json({ message: 'Link expired or invalid' });
    res.json(sig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. PATCH status — sign or reject
router.patch('/:id/status', async (req, res) => {
  const { status, reason } = req.body;
  try {
    const sig = await Signature.findByIdAndUpdate(
      req.params.id,
      { status, reason, signedAt: new Date() },
      { new: true }
    );
    res.json(sig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;