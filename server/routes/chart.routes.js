const express = require('express');
const router = express.Router();
const db = require('../db.js');

// Returns expense breakdown by category for a specific user
router.get('/chart-data', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ ok: false, error: 'Missing userId' });
    }

    // Query expense transactions grouped by category 
    const [rows] = await db.query(
      `SELECT 
        COALESCE(category, 'Other') AS label,
        ABS(SUM(amount)) AS value
       FROM Transactions
       WHERE user_id = ? AND amount < 0
       GROUP BY category
       ORDER BY value DESC`,
      [userId]
    );

    // If no data, return a helpful message
    if (!rows || rows.length === 0) {
      return res.json({ ok: true, data: [], message: 'No expenses found for this user' });
    }

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
