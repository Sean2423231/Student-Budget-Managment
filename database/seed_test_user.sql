-- Seed test user with sample data matching user_database.sql schema
USE `student_budget`;

-- Insert a test user
INSERT INTO Users (name, email, password)
SELECT 'Test User', 'test@example.com', 'test123'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE email = 'test@example.com')
LIMIT 1;

-- Get the test user's ID
SET @test_user_id = (SELECT user_id FROM Users WHERE email = 'test@example.com' LIMIT 1);

-- Insert categories for the test user
INSERT INTO Categories (user_id, name, kind)
SELECT @test_user_id, 'Rent', 'expense'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE user_id = @test_user_id AND name = 'Rent')
LIMIT 1;

INSERT INTO Categories (user_id, name, kind)
SELECT @test_user_id, 'Food', 'expense'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE user_id = @test_user_id AND name = 'Food')
LIMIT 1;

INSERT INTO Categories (user_id, name, kind)
SELECT @test_user_id, 'Transport', 'expense'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE user_id = @test_user_id AND name = 'Transport')
LIMIT 1;

INSERT INTO Categories (user_id, name, kind)
SELECT @test_user_id, 'Subscriptions', 'expense'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE user_id = @test_user_id AND name = 'Subscriptions')
LIMIT 1;

INSERT INTO Categories (user_id, name, kind)
SELECT @test_user_id, 'Salary', 'income'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE user_id = @test_user_id AND name = 'Salary')
LIMIT 1;

-- Get category IDs
SET @cat_rent = (SELECT category_id FROM Categories WHERE user_id = @test_user_id AND name = 'Rent' LIMIT 1);
SET @cat_food = (SELECT category_id FROM Categories WHERE user_id = @test_user_id AND name = 'Food' LIMIT 1);
SET @cat_transport = (SELECT category_id FROM Categories WHERE user_id = @test_user_id AND name = 'Transport' LIMIT 1);
SET @cat_subscriptions = (SELECT category_id FROM Categories WHERE user_id = @test_user_id AND name = 'Subscriptions' LIMIT 1);
SET @cat_salary = (SELECT category_id FROM Categories WHERE user_id = @test_user_id AND name = 'Salary' LIMIT 1);

-- Insert sample transactions
INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
SELECT @test_user_id, @cat_rent, 650.00, CURDATE() - INTERVAL 5 DAY, 'Rent Payment'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = @test_user_id AND vendor = 'Rent Payment')
LIMIT 1;

INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
SELECT @test_user_id, @cat_salary, 2500.00, CURDATE() - INTERVAL 2 DAY, 'Salary Deposit'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = @test_user_id AND vendor = 'Salary Deposit')
LIMIT 1;

INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
SELECT @test_user_id, @cat_food, 85.50, CURDATE() - INTERVAL 1 DAY, 'Grocery Store'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = @test_user_id AND vendor = 'Grocery Store')
LIMIT 1;

INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
SELECT @test_user_id, @cat_subscriptions, 12.99, CURDATE(), 'Netflix'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = @test_user_id AND vendor = 'Netflix')
LIMIT 1;

INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
SELECT @test_user_id, @cat_transport, 45.00, CURDATE(), 'Gas Station'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = @test_user_id AND vendor = 'Gas Station')
LIMIT 1;

-- Insert sample subscriptions
INSERT INTO Subscriptions (sub_name, price, frequency, date_created, next_renewal)
SELECT 'Netflix', 12.99, 'monthly', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Subscriptions WHERE sub_name = 'Netflix')
LIMIT 1;

INSERT INTO Subscriptions (sub_name, price, frequency, date_created, next_renewal)
SELECT 'Spotify', 9.99, 'monthly', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Subscriptions WHERE sub_name = 'Spotify')
LIMIT 1;

-- Link subscriptions to test user
INSERT INTO User_Subscription (user_id, sub_id, active)
SELECT @test_user_id, s.sub_id, TRUE
FROM Subscriptions s
WHERE s.sub_name = 'Netflix'
AND NOT EXISTS (SELECT 1 FROM User_Subscription WHERE user_id = @test_user_id AND sub_id = s.sub_id)
LIMIT 1;

INSERT INTO User_Subscription (user_id, sub_id, active)
SELECT @test_user_id, s.sub_id, TRUE
FROM Subscriptions s
WHERE s.sub_name = 'Spotify'
AND NOT EXISTS (SELECT 1 FROM User_Subscription WHERE user_id = @test_user_id AND sub_id = s.sub_id)
LIMIT 1;

