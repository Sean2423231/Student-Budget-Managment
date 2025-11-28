const express = require('express');
const router = express.Router();
const db = require('../db.js');

// GET /api/notifications?userId=123
router.get('/notifications', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'Missing userId' });
  }

  try {
    //Query for user goals that are within the range of 80-100% complete 
    const [goalRows] = await db.query(
      `SELECT goal_id, goal_name, target_amount, current_amount, target_date
       FROM Goals
       WHERE user_id = ? AND current_amount >= (target_amount * 0.8) AND current_amount < target_amount
       ORDER BY target_date ASC`,
      [userId]
    );

    const notifications = goalRows.map((goal) => ({
      type: 'goal',
      title: `${goal.goal_name || 'Goal'} is almost done`,
      detail: `${Number(goal.current_amount || 0).toFixed(2)} / ${Number(goal.target_amount || 0).toFixed(2)}`,
      dueDate: goal.target_date,
      goalId: goal.goal_id
    }));

    res.json({ ok: true, notifications });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
