-- Was making a 'student_budget' database for testing, but now using 'system_database' for all users
USE system_database;

-- Ensure test user exists
INSERT INTO Users (name, email, password)
SELECT 'Test User', 'test@example.com', 'test123'
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE email = 'test@example.com');

-- Get that user_id
SET @uid = (SELECT user_id FROM Users WHERE email = 'test@example.com');

-- Make sure categories exist for this user
INSERT INTO Categories (user_id, name, kind)
SELECT @uid, 'General Income', 'income'
WHERE NOT EXISTS ( SELECT 1 FROM Categories 
  WHERE user_id = @uid 
  AND name = 'General Income' AND kind = 'income'
);

INSERT INTO Categories (user_id, name, kind)
SELECT @uid, 'Utilities', 'expense'
WHERE NOT EXISTS (
  SELECT 1 FROM Categories
  WHERE user_id = @uid AND name = 'Utilities' AND kind = 'expense'
);

-- Look up category_ids
SET @cat_income = (
  SELECT category_id FROM Categories
  WHERE user_id = @uid AND name = 'General Income' AND kind = 'income'
  LIMIT 1
);

SET @cat_util = (
  SELECT category_id FROM Categories
  WHERE user_id = @uid AND name = 'Utilities' AND kind = 'expense'
  LIMIT 1
);

-- Income
INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
SELECT @uid, @cat_income, 2500.00, CURDATE() - INTERVAL 2 DAY, 'Salary Deposit'
WHERE NOT EXISTS (
  SELECT 1 FROM Transactions
  WHERE user_id = @uid AND vendor = 'Salary Deposit'
);

-- Past expense
INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
SELECT @uid, @cat_util, -650.00, CURDATE() - INTERVAL 5 DAY, 'Rent Payment'
WHERE NOT EXISTS (
  SELECT 1 FROM Transactions
  WHERE user_id = @uid AND vendor = 'Rent Payment'
);

-- lastest addition for notifications:

-- Upcoming bill (next 5 days) 
INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
SELECT @uid, @cat_util, -150.00, CURDATE() + INTERVAL 2 DAY, 'Utility Bill'
WHERE NOT EXISTS (
  SELECT 1 FROM Transactions
  WHERE user_id = @uid AND vendor = 'Utility Bill'
);

-- A goal near completion
INSERT INTO Goals (user_id, goal_name, target_amount, current_amount, target_date)
SELECT @uid, 'Laptop fund', 1000.00, 820.00, CURDATE() + INTERVAL 10 DAY
WHERE NOT EXISTS (
  SELECT 1 FROM Goals
  WHERE user_id = @uid AND goal_name = 'Laptop fund'
);