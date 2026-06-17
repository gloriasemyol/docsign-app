const express = require('express');
const crypto = require('crypto'); // built into Node, no install needed
const router = express.Router();
const Signature = require('../models/Signature');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');
const { sendSigningLink } = require('../services/pdfSigner'); // or wherever your emailService is imported

// 1. POST /api/signatures/finalize/:docId — generate the signed PDF
router.post('/finalize/:docId', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const sigs = await Signature.find({
      document: req.params.docId,
      status: 'signed'
    });

    const signedPath = await signPDF(doc.filePath, sigs);

    // Update document status
    doc.status = 'signed';
    await doc.save();

    res.json({ message: 'Signed PDF created!', path: signedPath });
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

// 4. POST /api/signatures/invite — send a signing link via email
router.post('/invite', protect, async (req, res) => {
  const { documentId, signerEmail, x, y, page } = req.body;
  try {
    const doc = await Document.findById(documentId);
    const token = crypto.randomBytes(32).toString('hex'); // random secure token

    const sig = await Signature.create({
      document: documentId,
      signerEmail,
      x, y, page,
      signingToken: token,
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    const url = `http://localhost:3000/sign/${token}`;
    await sendSigningLink(signerEmail, doc.originalName, url);

    res.json({ message: 'Invitation sent!', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. PATCH /api/signatures/:id/sign — (Fixed the loose block into a proper route!)
router.patch('/:id/sign', async (req, res) => {
  try {
    const sig = await Signature.findById(req.params.id);
    if (!sig) return res.status(404).json({ message: 'Signature field not found' });

    sig.status = 'signed';
    sig.signedAt = new Date();
    
    // 1. First, the signature saves to the database
    await sig.save(); 

    // 2. PASTE THE AUDIT LOG HERE (Right after saving, before sending response)
    await logAction(sig.document, 'signed', sig.signerEmail, req,
      `Signed at coordinates x:${sig.x} y:${sig.y}`
    );

    // 3. Then, the server sends back the success message to the user
    res.json({ message: 'Document signed successfully!', sig });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// ---> NEW ROUTES ADDED BELOW HERE <---
// ==========================================

// 6. GET by token (for the public sign page)
router.get('/token/:token', async (req, res) => {
  try {
    const sig = await Signature.findOne({
      signingToken: req.params.token,
      tokenExpiresAt: { $gt: new Date() } // not expired
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
      { new: true } // return updated document
    );
    res.json(sig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;