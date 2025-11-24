--create database, users table (if missing) and insert a test user

CREATE DATABASE IF NOT EXISTS `student_budget` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `student_budget`;

-- Create a Users table if it doesn't exist 
CREATE TABLE IF NOT EXISTS `Users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) DEFAULT NULL,
  `email` VARCHAR(200) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert a test user if it does not already exist
INSERT INTO Users (name, email, password)
SELECT 'Test User', 'test@example.com', 'test123'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE email = 'test@example.com')
LIMIT 1;
