const express = require('express');
const router = express.Router();

// GET /api/chart-data
// Returns pie chart data. Replace mockData with a real DB query using mysql2 when ready.
router.get('/chart-data', async (req, res) => {
  try {
    // MOCK DATA: categories and amounts
    const mockData = [
      { label: 'Rent', value: 650 },
      { label: 'Food', value: 200 },
      { label: 'Subscriptions', value: 80 },
      { label: 'Transport', value: 70 },
      { label: 'Savings', value: 300 }
    ];

    // Example: when your SQL server is ready, you can use mysql2 like this:
    // const mysql = require('mysql2/promise');
    // const conn = await mysql.createConnection({ host, user, password, database });
    // const [rows] = await conn.execute('SELECT category, amount FROM expenses');
    // transform rows into [{label, value}, ...] and return that instead of mockData

    res.json({ ok: true, data: mockData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
