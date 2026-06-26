const express = require('express');   // import express framework
const mongoose = require('mongoose'); // import database connector
const cors = require('cors');         // allow frontend to talk to backend
const dotenv = require('dotenv');     // read our secret .env file
const path = require('path');         // built-in path module for static folders

dotenv.config(); // load .env variables

const app = express(); // create our server

// Complete Global CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // allow server to read JSON data

// CATCH-ALL STATIC CONFIGURATION: Injects headers and resolves folder structural mismatches
app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
}, express.static(path.join(__dirname, 'uploads')));

// API Routes setup
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const docRoutes = require('./routes/docRoutes');
app.use('/api/docs', docRoutes);

const sigRoutes = require('./routes/signatureRoutes');
app.use('/api/signatures', sigRoutes);       

const auditRoutes = require('./routes/auditRoutes');
app.use('/api/audit', auditRoutes);

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log('Database connected!'))
  .catch(err => console.log('DB Error:', err));

// Test root route
app.get('/', (req, res) => {
  res.json({ message: 'DocSign API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});