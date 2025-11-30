const express = require('express');
const router = express.Router();
const db = require('../db.js');


// Basic registration: create a new user with plain-text password.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Missing email or password' });
  }
  try {
    const [existing] = await db.query('SELECT 1 FROM Users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }
    const [result] = await db.query('INSERT INTO Users (name, email, password) VALUES (?, ?, ?)', [name || null, email, password]);
    const userId = result.insertId;
    res.status(201).json({ ok: true, user: { id: userId, name: name || null, email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});



//login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Missing email or password' });
  }

  try {
    // Try to find a user where the stored password equals the provided password
    const [rows] = await db.query(
      `SELECT user_id, name, email FROM Users WHERE email = ? AND password = ? LIMIT 1`,
      [email, password]
    );

    if (!rows.length) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const user = rows[0];
    res.json({ ok: true, user: { id: user.user_id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

router.get('/user/overview', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ok: false, error: 'Missing userId'});
  }
  try {
    // Sum all income
    const [[income]] = await db.query(
      `SELECT IFNULL(SUM(t.amount),0) AS totalIncome 
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ? AND c.kind = 'income'`, [userId]
    );
    
    // Sum all expenses
    const [[expenses]] = await db.query(
      `SELECT IFNULL(SUM(t.amount),0) AS totalExpense 
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ? AND c.kind = 'expense'`, [userId]
    );
    
    // Calculate balance
    const [[balance]] = await db.query(
      `SELECT IFNULL(SUM(CASE WHEN c.kind = 'income' THEN t.amount ELSE -t.amount END), 0) AS balance
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ?`, [userId]
    );

    // Get upcoming bills from transactions
    const [transactionBills] = await db.query(
      `SELECT t.vendor, t.amount, DATE_FORMAT(t.date, '%b %e') AS dueDate
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ? AND c.kind = 'expense'
       ORDER BY t.date ASC LIMIT 5`, [userId]
    );

    // Get upcoming bills from subscriptions
    const [subscriptionBills] = await db.query(
      `SELECT s.sub_name AS vendor, 
              s.price AS amount,
              DATE_FORMAT(s.next_renewal, '%b %e') AS dueDate
       FROM User_Subscription us, Subscriptions s
       WHERE us.sub_id = s.sub_id
       AND us.user_id = ? AND us.active = 1
       ORDER BY s.next_renewal ASC LIMIT 5`, [userId]
    );

    // Combine both sources
    const allBills = [...transactionBills, ...subscriptionBills].slice(0, 5);
    
    // Get recent transactions
    const [transactions] = await db.query(
      `SELECT t.vendor, t.amount, DATE_FORMAT(t.date, '%b %e') AS dateLabel, c.name AS category
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ?
       ORDER BY t.date DESC LIMIT 6`, [userId]
    );


    res.json({
      ok: true,
      data: {
        incomeTotal: Number(income.totalIncome || 0),
        expenseTotal: Number(expenses.totalExpense || 0),
        balance: Number(balance.balance || 0),
        bills: allBills,
        transactions
      }
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});


router.get('/user/subscriptions', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'Missing userId' });
  }

  try {
    const [subs] = await db.query(
      `SELECT s.sub_id AS id,
              s.sub_name AS name,
              s.price AS amount,
              COALESCE(DAY(s.next_renewal), 1) AS day,
              s.frequency
       FROM User_Subscription us, Subscriptions s
       WHERE us.sub_id = s.sub_id
       AND us.user_id = ? AND us.active = 1
       ORDER BY day ASC`, [userId]
    );

    res.json({ ok: true, subscriptions: subs });
  } catch (err) {
    console.error('Subscriptions error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//Add a new subscription
router.post('/user/subscriptions/add', async (req, res) => {
  const { userId, name, price, day, frequency } = req.body;
  
  if (!userId || !name || !price || !day) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    // Calculate next renewal date based on day of month
    const today = new Date();
    const currentDay = today.getDate();
    let nextRenewal = new Date(today.getFullYear(), today.getMonth(), day);
    
    if (day < currentDay) {
      nextRenewal = new Date(today.getFullYear(), today.getMonth() + 1, day);
    }

    // Insert into Subscriptions table
    const [result] = await db.query(
      `INSERT INTO Subscriptions (sub_name, price, frequency, date_created, next_renewal)
       VALUES (?, ?, ?, CURDATE(), ?)`,
      [name, price, frequency || 'monthly', nextRenewal]
    );

    const subId = result.insertId;

    // Link to user in User_Subscription table
    await db.query(
      `INSERT INTO User_Subscription (user_id, sub_id, active)
       VALUES (?, ?, TRUE)`,
      [userId, subId]
    );

    res.json({ 
      ok: true, 
      subscription: { 
        id: subId, 
        name, 
        amount: parseFloat(price), 
        day: parseInt(day),
        frequency: frequency || 'monthly'
      } 
    });
  } catch (err) {
    console.error('Add subscription error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//Delete a subscription
router.delete('/user/subscriptions/delete', async (req, res) => {
  const { userId, subId } = req.body;
  
  if (!userId || !subId) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    // Set subscription to inactive instead of deleting
    await db.query(
      `UPDATE User_Subscription 
       SET active = 0 
       WHERE user_id = ? AND sub_id = ?`,
      [userId, subId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete subscription error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//Fetch user's savings goals
router.get('/user/goals', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'Missing userId' });
  }

  try {
    const [goals] = await db.query(
      `SELECT goal_id, goal_name, target_amount, current_amount, target_date
       FROM Goals
       WHERE user_id = ?
       ORDER BY target_date ASC`,
      [userId]
    );

    res.json({ ok: true, goals });
  } catch (err) {
    console.error('Goals error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST /api/user/transactions/add - Add a new transaction
router.post('/user/transactions/add', async (req, res) => {
  const { userId, vendor, amount, date, type } = req.body;
  
  if (!userId || !vendor || !amount || !date || !type) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    // Get the appropriate category_id based on type
    // For income, use category_id 1 (or first income category)
    // For expense, use category_id 2 (or first expense category)
    const [categories] = await db.query(
      `SELECT category_id FROM Categories WHERE kind = ? LIMIT 1`,
      [type]
    );

    if (categories.length === 0) {
      return res.status(400).json({ ok: false, error: 'No category found for transaction type' });
    }

    const categoryId = categories[0].category_id;

    // Insert transaction
    const [result] = await db.query(
      `INSERT INTO Transactions (user_id, vendor, amount, date, category_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, vendor, amount, date, categoryId]
    );

    res.json({ 
      ok: true, 
      transaction: { 
        id: result.insertId, 
        vendor, 
        amount: parseFloat(amount),
        date,
        type
      } 
    });
  } catch (err) {
    console.error('Add transaction error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
