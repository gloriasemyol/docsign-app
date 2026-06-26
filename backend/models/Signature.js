const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  signer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  signerEmail: String,      // for external signers who don't have an account
  x: Number,                // horizontal position on the PDF page
  y: Number,                // vertical position on the PDF page
  page: { type: Number, default: 1 },  // which page of the PDF
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending'
  },
  signedAt: Date,
  reason: String,           // reason if rejected

  signingToken: String,     // unique token for the public signing URL
  tokenExpiresAt: Date,     // the link expires after some time

  // CRITICAL FIX: Explicitly map the string placeholder to capture typed names like Gloria
  typedSignatureName: { 
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model('Signature', signatureSchema);