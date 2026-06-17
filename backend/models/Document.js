const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',       // this links to the User model
    required: true
  },
  originalName: String,  // the file's original name (e.g. contract.pdf)
  storedName: String,    // the name we save it as on disk
  filePath: String,      // path to the file on the server
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],  // only these 3 values allowed
    default: 'pending'
  },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);