const mongoose = require('mongoose');

// This is the 'blueprint' for every user in the database
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true  // name is mandatory
  },
  email: {
    type: String,
    required: true,
    unique: true    // no two users can have the same email
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true }); // auto-adds createdAt and updatedAt

module.exports = mongoose.model('User', userSchema);