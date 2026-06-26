const express = require('express'); //  Fixed!
const crypto = require('crypto');
const router = express.Router();
// ... rest of your code stays exactly the same
const Signature = require('../models/Signature');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');
const { sendSigningLink } = require('../services/pdfSigner');

// 1. POST /api/signatures/finalize/:docId
router.post('/finalize/:docId', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const sigs = await Signature.find({
      document: req.params.docId,
      status: 'signed'
    });

    const signedPath = await signPDF(doc.filePath, sigs);

    doc.status = 'signed';
    await doc.save();

    res.json({ message: 'Signed PDF created!', path: signedPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST /api/signatures — place signature field
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

// 3. GET /api/signatures/:docId
router.get('/:docId', protect, async (req, res) => {
  try {
    const sigs = await Signature.find({ document: req.params.docId });
    res.json(sigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. POST /api/signatures/invite — dynamic routing injection
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

    // Dynamic routing configuration checks: fallback gracefully to local host configurations
    const frontendBaseUrl = process.env.FRONTEND_URL || 'https://docsign-app-gilt.vercel.app';
    const url = `${frontendBaseUrl.replace(/\/$/, '')}/sign/${token}`;
    
    await sendSigningLink(signerEmail, doc.originalName, url);

    res.json({ message: 'Invitation processed cleanly!', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. PATCH /api/signatures/:id/sign
router.patch('/:id/sign', async (req, res) => {
  try {
    const sig = await Signature.findById(req.params.id);
    if (!sig) return res.status(404).json({ message: 'Signature field not found' });

    sig.status = 'signed';
    sig.signedAt = new Date();
    await sig.save(); 

    await logAction(sig.document, 'signed', sig.signerEmail, req,
      `Signed at coordinates x:${sig.x} y:${sig.y}`
    );

    res.json({ message: 'Document signed successfully!', sig });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. GET by token
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

// 7. PATCH status
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