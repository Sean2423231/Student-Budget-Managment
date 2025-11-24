--create database, users table (if missing) and insert a test user

CREATE DATABASE IF NOT EXISTS `student_budget` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `student_budget`;

-- Create a Users table 
CREATE TABLE IF NOT EXISTS `Users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) DEFAULT NULL,
  `email` VARCHAR(200) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert a test user
INSERT INTO Users (name, email, password)
SELECT 'Test User', 'test@example.com', 'test123'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE email = 'test@example.com')
LIMIT 1;

-- Create Transactions table
CREATE TABLE IF NOT EXISTS `Transactions` (
  `transaction_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `vendor` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `date` DATE DEFAULT CURDATE(),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES Users(`user_id`) ON DELETE CASCADE,
  INDEX (`user_id`),
  INDEX (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample transactions for the test user
INSERT INTO Transactions (user_id, vendor, amount, category, date)
SELECT u.user_id, 'Rent Payment', -650.00, 'Housing', CURDATE() - INTERVAL 5 DAY
FROM Users u
WHERE u.email = 'test@example.com'
AND NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = u.user_id AND vendor = 'Rent Payment')
LIMIT 1;

INSERT INTO Transactions (user_id, vendor, amount, category, date)
SELECT u.user_id, 'Salary Deposit', 2500.00, 'Income', CURDATE() - INTERVAL 2 DAY
FROM Users u
WHERE u.email = 'test@example.com'
AND NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = u.user_id AND vendor = 'Salary Deposit')
LIMIT 1;

INSERT INTO Transactions (user_id, vendor, amount, category, date)
SELECT u.user_id, 'Grocery Store', -85.50, 'Food', CURDATE() - INTERVAL 1 DAY
FROM Users u
WHERE u.email = 'test@example.com'
AND NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = u.user_id AND vendor = 'Grocery Store')
LIMIT 1;

INSERT INTO Transactions (user_id, vendor, amount, category, date)
SELECT u.user_id, 'Netflix', -12.99, 'Subscriptions', CURDATE()
FROM Users u
WHERE u.email = 'test@example.com'
AND NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = u.user_id AND vendor = 'Netflix')
LIMIT 1;

INSERT INTO Transactions (user_id, vendor, amount, category, date)
SELECT u.user_id, 'Gas Station', -45.00, 'Transport', CURDATE()
FROM Users u
WHERE u.email = 'test@example.com'
AND NOT EXISTS (SELECT 1 FROM Transactions WHERE user_id = u.user_id AND vendor = 'Gas Station')
LIMIT 1;

