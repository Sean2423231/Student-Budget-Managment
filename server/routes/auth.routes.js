// server/auth.routes.js
const express = require('express');
const router = express.Router();
const db = require('./db.js'); // connection pool from db.js

// POST /api/signup  -> create a user in Users table
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Missing fields' });
    }

    const sql =
      'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [name, email, password]);

    const userId = result.insertId;

    return res.json({
      ok: true,
      user: { user_id: userId, name, email }
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res
        .status(409)
        .json({ ok: false, message: 'Email already in use' });
    }
    return res
      .status(500)
      .json({ ok: false, message: 'Database error during signup' });
  }
});

// POST /api/login  -> check Users table for matching email+password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Missing fields' });
    }

    const sql =
      'SELECT user_id, name, email FROM Users WHERE email = ? AND password = ? LIMIT 1';
    const [rows] = await db.query(sql, [email, password]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ ok: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    return res.json({ ok: true, user });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, message: 'Database error during login' });
  }
});

module.exports = router;