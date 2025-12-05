const express = require('express');
const router = express.Router();
const db = require('../db.js');

//security
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;   // how string the hash is, higher is safer but slower


/*
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
*/

// new registration process with hashed password
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  // check input
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Missing email or password' });
  }
  try { // check if user exists
    const [existing] = await db.query('SELECT 1 FROM Users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }

    // hash the password before storing
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // insert user to db
    const [result] = await db.query('INSERT INTO Users (name, email, password) VALUES (?, ?, ?)',
      [name || null, email, hash]
    );

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
      `SELECT user_id, name, email, password FROM Users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const user = rows[0];
    // comapre password w/ stored hash password 
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }
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
    // Sum all income from current month
    const [[income]] = await db.query(
      `SELECT IFNULL(SUM(t.amount),0) AS totalIncome 
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ? AND c.kind = 'income'
       AND MONTH(t.date) = MONTH(CURRENT_DATE())
       AND YEAR(t.date) = YEAR(CURRENT_DATE())`, [userId]
    );
    
    // Sum all expenses from current month
    const [[expenses]] = await db.query(
      `SELECT IFNULL(SUM(t.amount),0) AS totalExpense 
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ? AND c.kind = 'expense'
       AND MONTH(t.date) = MONTH(CURRENT_DATE())
       AND YEAR(t.date) = YEAR(CURRENT_DATE())`, [userId]
    );
    
    // Calculate total balance (all time)
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
      `SELECT t.vendor, 
              CASE WHEN c.kind = 'expense' THEN -t.amount ELSE t.amount END AS amount,
              DATE_FORMAT(t.date, '%b %e') AS dateLabel, 
              c.name AS category
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

// Get balance history over time
router.get('/user/balance-history', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'Missing userId' });
  }

  try {
    // Get balance from before this month
    const [[previousBalance]] = await db.query(
      `SELECT IFNULL(SUM(CASE WHEN c.kind = 'income' THEN t.amount ELSE -t.amount END), 0) AS balance
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ?
       AND t.date < DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')`, [userId]
    );

    // Get all transactions for the current month, ordered by date
    const [transactions] = await db.query(
      `SELECT t.date, t.amount, c.kind
       FROM Transactions t, Categories c
       WHERE t.category_id = c.category_id
       AND t.user_id = ?
       AND MONTH(t.date) = MONTH(CURRENT_DATE())
       AND YEAR(t.date) = YEAR(CURRENT_DATE())
       ORDER BY t.date ASC, t.trans_id ASC`, [userId]
    );

    // Calculate cumulative balance at each transaction
    let runningBalance = Number(previousBalance.balance);
    const balanceHistory = transactions.map(trans => {
      const amount = Number(trans.amount);
      runningBalance += trans.kind === 'income' ? amount : -amount;
      
      return {
        date: trans.date,
        balance: runningBalance
      };
    });

    // Add starting point
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    balanceHistory.unshift({
      date: firstOfMonth,
      balance: Number(previousBalance.balance)
    });

    res.json({
      ok: true,
      data: balanceHistory
    });
  } catch (err) {
    console.error('Balance history error:', err);
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

//Add a new transaction
router.post('/user/transactions/add', async (req, res) => {
  const { userId, vendor, amount, date, type } = req.body;
  
  if (!userId || !vendor || !amount || !date || !type) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    // Get the appropriate category_id based on type
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

// Add a new goal
router.post('/user/goals/add', async (req, res) => {
  const { userId, goalName, targetAmount, currentAmount, targetDate } = req.body;
  
  if (!userId || !goalName || !targetAmount) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Goals (user_id, goal_name, target_amount, current_amount, target_date)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, goalName, targetAmount, currentAmount || 0, targetDate || null]
    );

    res.json({ 
      ok: true, 
      goal: { 
        id: result.insertId, 
        goalName, 
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        targetDate
      } 
    });
  } catch (err) {
    console.error('Add goal error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Add or subtract funds from a goal
router.post('/user/goals/update-funds', async (req, res) => {
  const { userId, goalId, amount } = req.body;
  
  if (!userId || !goalId || amount === undefined) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    // Update the current_amount by adding the amount (can be positive or negative)
    const [result] = await db.query(
      `UPDATE Goals 
       SET current_amount = GREATEST(0, current_amount + ?)
       WHERE goal_id = ? AND user_id = ?`,
      [amount, goalId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Goal not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Update goal funds error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Change target date of a goal
router.post('/user/goals/update-date', async (req, res) => {
  const { userId, goalId, targetDate } = req.body;
  
  if (!userId || !goalId) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    const [result] = await db.query(
      `UPDATE Goals 
       SET target_date = ?
       WHERE goal_id = ? AND user_id = ?`,
      [targetDate || null, goalId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Goal not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Update goal date error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//Delete a goal
router.post('/user/goals/delete', async (req, res) => {
  const { userId, goalId } = req.body;
  
  if (!userId || !goalId) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM Goals WHERE goal_id = ? AND user_id = ?`,
      [goalId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Goal not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
