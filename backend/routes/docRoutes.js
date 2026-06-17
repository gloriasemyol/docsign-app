const express = require('express');
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure Multer — where to save files and what to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // save to the uploads folder
  },
  filename: (req, file, cb) => {
    // create a unique name using current timestamp
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// Only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // accept
  } else {
    cb(new Error('Only PDF files allowed'), false); // reject
  }
};

const upload = multer({ storage, fileFilter });

// POST /api/docs/upload — upload a PDF
router.post('/upload', protect, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const doc = await Document.create({
      owner: req.user.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path
    });

    res.status(201).json({ message: 'File uploaded!', document: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/docs — get all documents for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;