require('dotenv').config(); // Loads environment variables from .env file

const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// 
app.use(cors());

// Initialize database connection
require('./db.js');

// Serve static files (HTML, CSS, JS) from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Middleware to parse incoming JSON requests
app.use(express.json());

// API routes
app.use('/api', require('./routes/chart.routes'));
app.use('/api', require('./routes/test.routes')); // Corrected: removed .js extension


// Fallback - serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Pages', 'home.html'));
});

// health-check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is talking to frontend!',
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});