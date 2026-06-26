const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Needed to fetch the cursive font bytes
const { PDFDocument, rgb } = require('pdf-lib'); 
const fontkit = require('@pdf-lib/fontkit'); // Extra helper to register custom fonts
const Signature = require('../models/Signature');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

// 1. POST /api/signatures/finalize/:docId — Bakes an authentic cursive signature into the PDF
router.post('/finalize/:docId', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const sigs = await Signature.find({
      document: req.params.docId,
      status: 'signed'
    });

    if (sigs.length > 0) {
      const originalFilePath = path.join(__dirname, '..', doc.filePath);
      
      if (fs.existsSync(originalFilePath)) {
        const existingPdfBytes = fs.readFileSync(originalFilePath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        
        // Register the fontkit engine to handle external custom fonts
        pdfDoc.registerFontkit(fontkit);

        let customSignatureFont;
        try {
          // Fetch a beautiful, lightweight, real-world cursive signature font from a public CDN
          const fontUrl = 'https://fonts.gstatic.com/s/parisienne/v12/m8JVjfNMAZ6r0773q3bXv7tDVA.ttf';
          const fontResponse = await axios.get(fontUrl, { responseType: 'arraybuffer' });
          const fontBytes = fontResponse.data;
          
          // Embed the true cursive font into the PDF document structure
          customSignatureFont = await pdfDoc.embedFont(fontBytes);
        } catch (fontErr) {
          console.warn("Failed to fetch cursive font, falling back to built-in italic:", fontErr.message);
        }

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        for (const sig of sigs) {
          const scaleX = width / 700;
          const pdfX = sig.x * scaleX;
          
          const scaleY = height / 950; 
          const pdfY = height - (sig.y * scaleY);

          const finalSignatureText = sig.typedSignatureName || 'Gloria';

          // If custom font loaded successfully, use it! Otherwise, fall back to native bold italic
          const activeFont = customSignatureFont || await pdfDoc.embedFont('Times-BoldItalic');
          const fontSize = customSignatureFont ? 24 : 14; // Cursive fonts usually need to be larger to look natural

          // Render ONLY your handwritten signature name onto the PDF canvas
          firstPage.drawText(finalSignatureText, {
            x: pdfX,
            y: pdfY,
            size: fontSize,
            font: activeFont,
            color: rgb(0.05, 0.15, 0.45), // Classic premium fountain pen "Midnight Blue" ink color!
          });
        }

        const modifiedPdfBytes = await pdfDoc.save();
        fs.writeFileSync(originalFilePath, modifiedPdfBytes);
      }
    }

    doc.status = 'signed';
    await doc.save();

    res.json({ message: 'Signed PDF processed!', path: doc.filePath });
  } catch (err) {
    console.error("PDF Finalizer Engine Crash Trace:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// LEAVE UNCHANGED: HELPER ROUTE STRUCTURES BELOW
// ==========================================

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

router.get('/:docId', protect, async (req, res) => {
  try {
    const sigs = await Signature.find({ document: req.params.docId });
    res.json(sigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
    console.log(`Link: ${url}`);
    console.log(`=============================================`);

    res.json({ message: 'Invitation processed cleanly!', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

router.patch('/:id/sign', async (req, res) => {
  try {
    const sig = await Signature.findById(req.params.id);
    if (!sig) return res.status(404).json({ message: 'Signature field not found' });

    if (req.body.typedName) {
      sig.typedSignatureName = req.body.typedName;
    }

    sig.status = 'signed';
    sig.signedAt = new Date();
    await sig.save(); 

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