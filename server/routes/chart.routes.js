const express = require('express');
const router = express.Router();


router.get('/chart-data', async (req, res) => {
  try {
    // MOCK DATA: categories and amounts
    const mockData = [
      { label: 'Rent', value: 30 },
      { label: 'Food', value: 200 },
      { label: 'Subscriptions', value: 80 },
      { label: 'Transport', value: 70 },
      { label: 'Savings', value: 300 }
    ];



    res.json({ ok: true, data: mockData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
