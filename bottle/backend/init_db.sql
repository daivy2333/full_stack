-- Active: 1765277001989@@127.0.0.1@3306@drift_bottle
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS drift_bottle;
USE drift_bottle;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- 创建漂流瓶表
CREATE TABLE IF NOT EXISTS bottles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  author_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  views INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建用户状态表
CREATE TABLE IF NOT EXISTS user_states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  has_picked_today BOOLEAN DEFAULT FALSE,
  has_thrown_today BOOLEAN DEFAULT FALSE,
  last_pick_date DATE NULL,
  last_throw_date DATE NULL,
  current_view ENUM('pick', 'write') DEFAULT 'pick',
  dev_mode BOOLEAN DEFAULT FALSE,
  has_seen_tutorial BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建用户浏览记录表
CREATE TABLE IF NOT EXISTS user_bottle_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bottle_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_bottle (user_id, bottle_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);

-- 创建用户收藏表
CREATE TABLE IF NOT EXISTS user_bottle_saves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bottle_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  annotation VARCHAR(10),
  UNIQUE KEY unique_user_bottle (user_id, bottle_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);

-- 创建用户点赞/点踩表
CREATE TABLE IF NOT EXISTS user_bottle_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bottle_id INT NOT NULL,
  reaction_type ENUM('like', 'dislike') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_bottle (user_id, bottle_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);

-- 创建获取随机未看漂流瓶的存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS get_random_unseen_bottle(
  IN p_user_id INT
)
BEGIN
  SELECT b.*, u.username
  FROM bottles b
  JOIN users u ON b.user_id = u.id
  WHERE b.is_active = TRUE 
  AND b.id NOT IN (
    SELECT bottle_id FROM user_bottle_views WHERE user_id = p_user_id
  )
  ORDER BY RAND()
  LIMIT 1;
END //
DELIMITER ;

-- 创建一个默认用户（用于匿名用户）
INSERT IGNORE INTO users (id, username, password_hash) VALUES (1, '匿名用户', 'anonymous_hash');
