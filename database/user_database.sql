CREATE DATABASE system_database;
USE system_database;

-- USERS TABLE
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    date_created DATE DEFAULT (CURRENT_DATE)
);

-- CATEGORIES TABLE
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL, -- e.g. groceries, rent, etc
    kind ENUM('income', 'expense') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- TRANSACTIONS TABLE
CREATE TABLE Transactions (
    trans_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    vendor VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

-- GOALS TABLE
CREATE TABLE Goals (
    goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- SUBSCRIPTIONS TABLE
CREATE TABLE Subscriptions (
    sub_id INT AUTO_INCREMENT PRIMARY KEY,
    sub_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
    date_created DATE NOT NULL,
    next_renewal DATE
);

-- USER_SUBSCRIPTION (relationship between Subscriptions and User tables)
CREATE TABLE User_Subscription (
    user_id INT NOT NULL,
    sub_id INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, sub_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (sub_id) REFERENCES Subscriptions(sub_id)
);
