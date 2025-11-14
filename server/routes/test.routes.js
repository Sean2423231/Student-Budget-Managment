const express = require('express');
const router = express.Router();
const db = require('../db.js'); // Imports the database connection pool from db.js

// A simple test route to confirm the server is running.
// Accessible at http://localhost:3000/api/test
router.get('/test', (req, res) => {
  res.json({ message: 'Test route is working!' });
});

// A route to test the database connection.
// Accessible at http://localhost:3000/api/test-db
router.get('/test-db', async (req, res) => {
  try {
    // Executes a simple query to verify the database is connected and responsive.
    const [results] = await db.query('SELECT 1 + 1 AS solution');
    res.json({
      message: 'Database connection successful!',
      solution: results[0].solution
    });
  } catch (err) {
    console.error('Database query failed:', err);
    res.status(500).json({ message: 'Database query failed', error: err.message });
  }
});

// Exports the router to be used in server/index.js
module.exports = router;