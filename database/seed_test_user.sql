USE student_budget; 

-- create tables
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    date_created DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    kind ENUM('income', 'expense') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS Transactions (
    trans_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    vendor VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE IF NOT EXISTS Goals (
    goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS Subscriptions (
    sub_id INT AUTO_INCREMENT PRIMARY KEY,
    sub_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
    date_created DATE NOT NULL,
    next_renewal DATE
);

CREATE TABLE IF NOT EXISTS User_Subscription (
    user_id INT NOT NULL,
    sub_id INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, sub_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (sub_id) REFERENCES Subscriptions(sub_id)
);

-- Insert a test user (if not exists)
--password is test123 but hashed 
INSERT INTO Users (name, email, password)
SELECT 'Test User', 'test@example.com', '$2b$10$n.x.9/kKlFhV5T7x654fkOyIOf/Od6WBpz4vQyPcFH9DmGZPoYKH.'
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