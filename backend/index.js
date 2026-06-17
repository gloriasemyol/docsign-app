const express = require('express');   // import express framework
const mongoose = require('mongoose'); // import database connector
const cors = require('cors');         // allow frontend to talk to backend
const dotenv = require('dotenv');     // read our secret .env file

dotenv.config(); // load .env variables

const app = express(); // create our server

app.use(cors());               // allow cross-origin requests
app.use(express.json());
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
const docRoutes = require('./routes/docRoutes');
app.use('/api/docs', docRoutes);
const sigRoutes = require('./routes/signatureRoutes');
app.use('/api/signatures', sigRoutes);       // allow server to read JSON data
app.use('/uploads', express.static('uploads')); // serve uploaded files

const auditRoutes = require('./routes/auditRoutes');
app.use('/api/audit', auditRoutes)

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Database connected!'))
  .catch(err => console.log('DB Error:', err));

// Test route - visit localhost:5000 to see this
app.get('/', (req, res) => {
  res.json({ message: 'DocSign API is running!' });
});

// Start server on port 5000
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});