const express = require('express');   // import express framework
const mongoose = require('mongoose'); // import database connector
const cors = require('cors');         // allow frontend to talk to backend
const dotenv = require('dotenv');     // read our secret .env file
const path = require('path');         // Added built-in path module for static folders

dotenv.config(); // load .env variables

const app = express(); // create our server

// Middleware configurations
app.use(cors());               // allow cross-origin requests
app.use(express.json());       // allow server to read JSON data

// FIX: Explicitly inject CORS headers into your static uploads route to prevent browser blocking
app.use('/uploads', cors(), express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

// API Routes setup
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const docRoutes = require('./routes/docRoutes');
app.use('/api/docs', docRoutes);

const sigRoutes = require('./routes/signatureRoutes');
app.use('/api/signatures', sigRoutes);       

const auditRoutes = require('./routes/auditRoutes');
app.use('/api/audit', auditRoutes);

// Connect to MongoDB database with timeout configuration limits
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000 // Prevents blocking execution infinitely if connection drops
  })
  .then(() => console.log('Database connected!'))
  .catch(err => console.log('DB Error:', err));

// Test root route - visit to see if backend is responsive
app.get('/', (req, res) => {
  res.json({ message: 'DocSign API is running!' });
});

// Dynamic Port Allocation for Production Servers (Render uses process.env.PORT)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});