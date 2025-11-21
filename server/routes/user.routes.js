const express = require('express');
const router = express.Router();
const db = require('../db.js');

//POST /api/login 
//Basic check so a student can log in with an email + password that already lives in the DB.
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ok: false, error: 'Missing email or password'});
  }

  try { //Check credentials
    const [rows] = await db.query(
      'SELECT user_id, name, email, password FROM Users WHERE email = ?', [email]
    );

    if (!rows.length || rows[0].password !== password) { //No user found w/ that email or user exits but password doesn't match
      return res.status(401).json({ok: false, error: 'Invalid credentials'});
    }

    //Send back response, successful login
    const user = rows[0];
    res.json({ 
      ok: true,
      user: { id: user.user_id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ok: false, error: 'Server error'});
  }
});

//GET /api/user/overview?userId=123 
//Grab money info so we can fill cards without extra math on the front end.
router.get('/user/overview', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ok: false, error: 'Missing userId'});
  }
  try {
    //Sum all positive amount  as income
    const [[income]] = await db.query(
      'SELECT IFNULL(SUM(amount),0) AS totalIncome FROM Transactions WHERE user_id = ? AND amount > 0',[userId]
    );
    //Sum all negative amount as expenses
    const [[expenses]] = await db.query(
      'SELECT IFNULL(SUM(amount),0) AS totalExpense FROM Transactions WHERE user_id = ? AND amount < 0',[userId]
    );
    //Sum all amount as balance
    const [[balance]] = await db.query(
      'SELECT IFNULL(SUM(amount),0) AS balance FROM Transactions WHERE user_id = ?',[userId]
    );

    //Pull 5 most recent bills and 6 most recent transactions for the user.
    const [bills] = await db.query(
      `SELECT vendor, ABS(amount) AS amount, DATE_FORMAT(date, '%b %e') AS dueDate
       FROM Transactions WHERE user_id = ? AND amount < 0
       ORDER BY date ASC LIMIT 5`,[userId]
    );
    const [transactions] = await db.query(
      `SELECT vendor, amount, DATE_FORMAT(date, '%b %e') AS dateLabel
       FROM Transactions WHERE user_id = ?
       ORDER BY date DESC LIMIT 6`,[userId]
    );

    //Send back response
    res.json({
      ok: true,
      data: {
        incomeTotal: Number(income.totalIncome || 0),
        expenseTotal: Math.abs(Number(expenses.totalExpense || 0)),
        balance: Number(balance.balance || 0),
        bills,
        transactions
      }
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//GET /api/user/subscriptions?userId=123
//Reuse the same user id to pull their subscription list for the calendar/list UI.
router.get('/user/subscriptions', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'Missing userId' });
  }

  try {
    //Links two tables. User_Subscription is linking table between users and subscriptions 
    const [subs] = await db.query(
      `SELECT s.sub_name AS name,
              s.price AS amount,
              COALESCE(DAY(s.next_renewal), 1) AS day,
              s.frequency
       FROM User_Subscription us
       JOIN Subscriptions s ON s.sub_id = us.sub_id
       WHERE us.user_id = ? AND us.active = 1
       ORDER BY day ASC`, [userId]
    );

//Send back response
    res.json({ ok: true, subscriptions: subs });
  } catch (err) {
    console.error('Subscriptions error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
