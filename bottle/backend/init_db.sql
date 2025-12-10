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

-- 创建 bottle_stats 视图
CREATE OR REPLACE VIEW bottle_stats AS
SELECT 
    b.id,
    b.message,
    b.author_name,
    b.created_at,
    b.views,
    COUNT(CASE WHEN ubr.reaction_type = 'like' THEN 1 END) AS like_count,
    COUNT(CASE WHEN ubr.reaction_type = 'dislike' THEN 1 END) AS dislike_count,
    COUNT(ubs.id) AS save_count
FROM 
    bottles b
LEFT JOIN 
    user_bottle_reactions ubr ON b.id = ubr.bottle_id
LEFT JOIN 
    user_bottle_saves ubs ON b.id = ubs.bottle_id
WHERE 
    b.is_active = TRUE
GROUP BY 
    b.id, b.message, b.author_name, b.created_at, b.views;

-- 创建一个默认用户（用于匿名用户）
INSERT IGNORE INTO users (id, username, password_hash) VALUES (1, '匿名用户', 'anonymous_hash');



-- 漂流瓶项目逻辑分离 - 存储过程实现
-- 注意：先删除已存在的存储过程，再重新创建

-- 1. 漂流瓶相关逻辑 --------------------------------------------------

-- 获取随机漂流瓶及其统计信息
DROP PROCEDURE IF EXISTS get_random_bottle_with_stats;
DELIMITER //
CREATE PROCEDURE get_random_bottle_with_stats(
  IN p_user_id INT
)
BEGIN
  DECLARE v_bottle_id INT;
  DECLARE v_user_id INT;
  DECLARE v_anonymous_user_id INT DEFAULT 1; -- 默认匿名用户ID

  -- 如果是匿名用户，使用匿名用户ID
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = NULL;
  END IF;

  -- 获取随机漂流瓶ID
  IF p_user_id IS NULL THEN
    -- 匿名用户：从所有活跃漂流瓶中随机获取
    SELECT id INTO v_bottle_id
    FROM bottles
    WHERE is_active = TRUE
    ORDER BY RAND()
    LIMIT 1;
  ELSE
    -- 注册用户：排除已查看过的漂流瓶
    SELECT id INTO v_bottle_id
    FROM bottles
    WHERE is_active = TRUE
    AND id NOT IN (
      SELECT bottle_id 
      FROM user_bottle_views 
      WHERE user_id = p_user_id
    )
    ORDER BY RAND()
    LIMIT 1;
  END IF;

  -- 如果找不到漂流瓶，返回空结果
  IF v_bottle_id IS NULL THEN
    SELECT 
      NULL AS id,
      '没有更多漂流瓶了' AS message,
      NULL AS author,
      NULL AS date,
      0 AS likes,
      0 AS dislikes,
      0 AS views,
      NULL AS userReaction;
  ELSE
    -- 获取漂流瓶详情及统计信息
    SELECT 
      b.id,
      b.message,
      COALESCE(b.author_name, u.username) AS author,
      DATE(b.created_at) AS date,
      b.likes,
      b.dislikes,
      b.views + 1 AS views, -- 预加一次浏览量
      COALESCE((
        SELECT reaction_type 
        FROM user_bottle_reactions 
        WHERE user_id = p_user_id AND bottle_id = b.id
        LIMIT 1
      ), NULL) AS userReaction
    FROM bottles b
    JOIN users u ON b.user_id = u.id
    WHERE b.id = v_bottle_id;

    -- 如果用户已登录，记录浏览并增加浏览次数
    IF p_user_id IS NOT NULL THEN
      INSERT INTO user_bottle_views (user_id, bottle_id) 
      VALUES (p_user_id, v_bottle_id) 
      ON DUPLICATE KEY UPDATE viewed_at = NOW();

      UPDATE bottles SET views = views + 1 WHERE id = v_bottle_id;
    END IF;
  END IF;
END //
DELIMITER ;

-- 对漂流瓶做出反应（点赞/点踩）
DROP PROCEDURE IF EXISTS react_to_bottle;
DELIMITER //
CREATE PROCEDURE react_to_bottle(
  IN p_user_id INT,
  IN p_bottle_id INT,
  IN p_reaction_type VARCHAR(10) -- 'like' 或 'dislike'
)
BEGIN
  DECLARE v_old_reaction_type VARCHAR(10);
  DECLARE v_exists INT;
  DECLARE v_likes INT;
  DECLARE v_dislikes INT;
  DECLARE v_new_reaction_type VARCHAR(10);

  -- 检查漂流瓶是否存在
  SELECT COUNT(*) INTO v_exists
  FROM bottles
  WHERE id = p_bottle_id AND is_active = TRUE;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '漂流瓶不存在或已被删除';
  END IF;

  -- 获取用户之前的反应
  SELECT reaction_type INTO v_old_reaction_type
  FROM user_bottle_reactions
  WHERE user_id = p_user_id AND bottle_id = p_bottle_id;

  -- 获取当前统计
  SELECT likes, dislikes INTO v_likes, v_dislikes
  FROM bottles
  WHERE id = p_bottle_id;

  -- 处理反应
  IF v_old_reaction_type IS NULL THEN
    -- 新增反应
    INSERT INTO user_bottle_reactions (user_id, bottle_id, reaction_type)
    VALUES (p_user_id, p_bottle_id, p_reaction_type);

    -- 更新bottles表
    IF p_reaction_type = 'like' THEN
      UPDATE bottles SET likes = likes + 1 WHERE id = p_bottle_id;
      SET v_likes = v_likes + 1;
    ELSEIF p_reaction_type = 'dislike' THEN
      UPDATE bottles SET dislikes = dislikes + 1 WHERE id = p_bottle_id;
      SET v_dislikes = v_dislikes + 1;
    END IF;
    
    SET v_new_reaction_type = p_reaction_type;
    
  ELSEIF v_old_reaction_type != p_reaction_type THEN
    -- 更改反应类型
    UPDATE user_bottle_reactions 
    SET reaction_type = p_reaction_type, created_at = NOW()
    WHERE user_id = p_user_id AND bottle_id = p_bottle_id;

    -- 更新bottles表
    IF v_old_reaction_type = 'like' AND p_reaction_type = 'dislike' THEN
      UPDATE bottles SET likes = likes - 1, dislikes = dislikes + 1 WHERE id = p_bottle_id;
      SET v_likes = v_likes - 1;
      SET v_dislikes = v_dislikes + 1;
    ELSEIF v_old_reaction_type = 'dislike' AND p_reaction_type = 'like' THEN
      UPDATE bottles SET likes = likes + 1, dislikes = dislikes - 1 WHERE id = p_bottle_id;
      SET v_likes = v_likes + 1;
      SET v_dislikes = v_dislikes - 1;
    END IF;
    
    SET v_new_reaction_type = p_reaction_type;
  ELSE
    -- 相同反应类型，取消反应
    DELETE FROM user_bottle_reactions
    WHERE user_id = p_user_id AND bottle_id = p_bottle_id;

    -- 更新bottles表
    IF p_reaction_type = 'like' THEN
      UPDATE bottles SET likes = likes - 1 WHERE id = p_bottle_id;
      SET v_likes = v_likes - 1;
    ELSEIF p_reaction_type = 'dislike' THEN
      UPDATE bottles SET dislikes = dislikes - 1 WHERE id = p_bottle_id;
      SET v_dislikes = v_dislikes - 1;
    END IF;
    
    SET v_new_reaction_type = NULL;
  END IF;

  -- 返回更新后的统计信息
  SELECT 
    v_likes AS likes,
    v_dislikes AS dislikes,
    v_new_reaction_type AS userReaction;
END //
DELIMITER ;

-- 获取漂流瓶详细信息
DROP PROCEDURE IF EXISTS get_bottle_details;
DELIMITER //
CREATE PROCEDURE get_bottle_details(
  IN p_user_id INT,
  IN p_bottle_id INT
)
BEGIN
  DECLARE v_bottle_exists INT;
  DECLARE v_anonymous_user_id INT DEFAULT 1;

  -- 检查漂流瓶是否存在
  SELECT COUNT(*) INTO v_bottle_exists
  FROM bottles
  WHERE id = p_bottle_id AND is_active = TRUE;

  IF v_bottle_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '漂流瓶不存在或已被删除';
  END IF;

  -- 返回漂流瓶详情及统计信息
  SELECT 
    b.id,
    b.message,
    COALESCE(b.author_name, u.username) AS author,
    DATE(b.created_at) AS date,
    b.likes,
    b.dislikes,
    b.views,
    COALESCE((
      SELECT reaction_type 
      FROM user_bottle_reactions 
      WHERE user_id = p_user_id AND bottle_id = b.id
      LIMIT 1
    ), NULL) AS userReaction,
    COALESCE((
      SELECT annotation 
      FROM user_bottle_saves 
      WHERE user_id = p_user_id AND bottle_id = b.id
      LIMIT 1
    ), NULL) AS userAnnotation
  FROM bottles b
  JOIN users u ON b.user_id = u.id
  WHERE b.id = p_bottle_id;
END //
DELIMITER ;

-- 创建漂流瓶
DROP PROCEDURE IF EXISTS create_bottle;
DELIMITER //
CREATE PROCEDURE create_bottle(
  IN p_user_id INT,
  IN p_message TEXT,
  IN p_author_name VARCHAR(50)
)
BEGIN
  DECLARE v_has_thrown_today BOOLEAN;
  DECLARE v_last_throw_date DATE;
  DECLARE v_today DATE DEFAULT CURDATE();
  DECLARE v_new_bottle_id INT;
  DECLARE v_anonymous_user_id INT DEFAULT 1;

  -- 如果用户不存在，使用匿名用户
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = v_anonymous_user_id;
  END IF;

  -- 检查用户今天是否已经投放过漂流瓶
  SELECT 
    has_thrown_today AND last_throw_date = v_today,
    last_throw_date
  INTO v_has_thrown_today, v_last_throw_date
  FROM user_states
  WHERE user_id = p_user_id;

  IF v_has_thrown_today THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '今天已经投放过漂流瓶了，请明天再来';
  END IF;

  -- 创建漂流瓶
  INSERT INTO bottles (user_id, message, author_name)
  VALUES (p_user_id, p_message, p_author_name);
  
  SET v_new_bottle_id = LAST_INSERT_ID();

  -- 更新用户状态
  IF EXISTS (SELECT 1 FROM user_states WHERE user_id = p_user_id) THEN
    UPDATE user_states
    SET 
      has_thrown_today = TRUE,
      last_throw_date = v_today
    WHERE user_id = p_user_id;
  ELSE
    INSERT INTO user_states (user_id, has_thrown_today, last_throw_date)
    VALUES (p_user_id, TRUE, v_today);
  END IF;

  -- 返回新创建的漂流瓶
  SELECT 
    b.id,
    b.message,
    COALESCE(b.author_name, u.username) AS author,
    DATE(b.created_at) AS date,
    b.likes,
    b.dislikes,
    b.views,
    NULL AS userReaction
  FROM bottles b
  JOIN users u ON b.user_id = u.id
  WHERE b.id = v_new_bottle_id;
END //
DELIMITER ;

-- 2. 用户状态管理逻辑 --------------------------------------------------

-- 获取用户状态
DROP PROCEDURE IF EXISTS get_user_state;
DELIMITER //
CREATE PROCEDURE get_user_state(
  IN p_user_id INT
)
BEGIN
  DECLARE v_today DATE DEFAULT CURDATE();
  DECLARE v_state_exists INT;
  DECLARE v_anonymous_user_id INT DEFAULT 1;

  -- 如果用户不存在，使用匿名用户
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = v_anonymous_user_id;
  END IF;

  -- 检查用户状态是否存在
  SELECT COUNT(*) INTO v_state_exists
  FROM user_states
  WHERE user_id = p_user_id;

  -- 如果状态不存在，创建默认状态
  IF v_state_exists = 0 THEN
    INSERT INTO user_states (user_id) VALUES (p_user_id);
  END IF;

  -- 检查日期是否变化，如果变化则重置状态
  UPDATE user_states
  SET 
    has_picked_today = IF(last_pick_date = v_today, has_picked_today, FALSE),
    has_thrown_today = IF(last_throw_date = v_today, has_thrown_today, FALSE)
  WHERE user_id = p_user_id;

  -- 返回用户状态
  SELECT 
    IF(has_picked_today AND last_pick_date = v_today, TRUE, FALSE) AS hasPickedToday,
    IF(has_thrown_today AND last_throw_date = v_today, TRUE, FALSE) AS hasThrownToday,
    last_pick_date AS lastPickDate,
    last_throw_date AS lastThrowDate,
    current_view AS currentView,
    dev_mode AS devMode,
    has_seen_tutorial AS hasSeenTutorial
  FROM user_states
  WHERE user_id = p_user_id;
END //
DELIMITER ;

-- 更新用户状态
DROP PROCEDURE IF EXISTS update_user_state;
DELIMITER //
CREATE PROCEDURE update_user_state(
  IN p_user_id INT,
  IN p_has_picked_today BOOLEAN,
  IN p_has_thrown_today BOOLEAN,
  IN p_current_view VARCHAR(10),
  IN p_dev_mode BOOLEAN,
  IN p_has_seen_tutorial BOOLEAN
)
BEGIN
  DECLARE v_today DATE DEFAULT CURDATE();
  DECLARE v_state_exists INT;
  DECLARE v_anonymous_user_id INT DEFAULT 1;

  -- 如果用户不存在，使用匿名用户
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = v_anonymous_user_id;
  END IF;

  -- 检查用户状态是否存在
  SELECT COUNT(*) INTO v_state_exists
  FROM user_states
  WHERE user_id = p_user_id;

  -- 如果状态不存在，创建默认状态
  IF v_state_exists = 0 THEN
    INSERT INTO user_states (user_id) VALUES (p_user_id);
  END IF;

  -- 更新用户状态
  UPDATE user_states
  SET 
    has_picked_today = CASE 
      WHEN p_has_picked_today IS NOT NULL THEN p_has_picked_today
      ELSE has_picked_today
    END,
    has_thrown_today = CASE 
      WHEN p_has_thrown_today IS NOT NULL THEN p_has_thrown_today
      ELSE has_thrown_today
    END,
    last_pick_date = CASE 
      WHEN p_has_picked_today IS NOT NULL AND p_has_picked_today = TRUE THEN v_today
      ELSE last_pick_date
    END,
    last_throw_date = CASE 
      WHEN p_has_thrown_today IS NOT NULL AND p_has_thrown_today = TRUE THEN v_today
      ELSE last_throw_date
    END,
    current_view = COALESCE(p_current_view, current_view),
    dev_mode = COALESCE(p_dev_mode, dev_mode),
    has_seen_tutorial = COALESCE(p_has_seen_tutorial, has_seen_tutorial)
  WHERE user_id = p_user_id;

  -- 返回更新后的状态
  CALL get_user_state(p_user_id);
END //
DELIMITER ;

-- 记录用户已捡起漂流瓶
DROP PROCEDURE IF EXISTS record_bottle_picked;
DELIMITER //
CREATE PROCEDURE record_bottle_picked(
  IN p_user_id INT
)
BEGIN
  DECLARE v_today DATE DEFAULT CURDATE();
  DECLARE v_anonymous_user_id INT DEFAULT 1;

  -- 如果用户不存在，使用匿名用户
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = v_anonymous_user_id;
  END IF;

  -- 更新用户状态
  UPDATE user_states
  SET 
    has_picked_today = TRUE,
    last_pick_date = v_today
  WHERE user_id = p_user_id;
END //
DELIMITER ;

-- 3. 用户收藏相关逻辑 --------------------------------------------------

-- 获取用户收藏的漂流瓶
DROP PROCEDURE IF EXISTS get_user_saved_bottles;
DELIMITER //
CREATE PROCEDURE get_user_saved_bottles(
  IN p_user_id INT
)
BEGIN
  DECLARE v_anonymous_user_id INT DEFAULT 1;

  -- 如果用户不存在，使用匿名用户
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = v_anonymous_user_id;
  END IF;

  -- 获取用户收藏的漂流瓶
  SELECT
    b.id,
    b.message,
    COALESCE(b.author_name, u.username) AS author,
    DATE(b.created_at) AS date,
    b.views,
    DATE(s.saved_at) AS savedDate,
    s.annotation,
    b.likes,
    b.dislikes
  FROM user_bottle_saves s
  JOIN bottles b ON s.bottle_id = b.id
  JOIN users u ON b.user_id = u.id
  WHERE s.user_id = p_user_id AND b.is_active = TRUE
  ORDER BY s.saved_at DESC;
END //
DELIMITER ;

-- 收藏漂流瓶
DROP PROCEDURE IF EXISTS save_bottle;
DELIMITER //
CREATE PROCEDURE save_bottle(
  IN p_user_id INT,
  IN p_bottle_id INT,
  IN p_annotation VARCHAR(10)
)
BEGIN
  DECLARE v_bottle_exists INT;
  DECLARE v_save_exists INT;
  DECLARE v_anonymous_user_id INT DEFAULT 1;

  -- 如果用户不存在，使用匿名用户
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = v_anonymous_user_id;
  END IF;

  -- 检查漂流瓶是否存在
  SELECT COUNT(*) INTO v_bottle_exists
  FROM bottles
  WHERE id = p_bottle_id AND is_active = TRUE;

  IF v_bottle_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '漂流瓶不存在或已被删除';
  END IF;

  -- 检查是否已经收藏过
  SELECT COUNT(*) INTO v_save_exists
  FROM user_bottle_saves
  WHERE user_id = p_user_id AND bottle_id = p_bottle_id;

  IF v_save_exists > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '已经收藏过这个漂流瓶';
  END IF;

  -- 收藏漂流瓶
  INSERT INTO user_bottle_saves (user_id, bottle_id, annotation)
  VALUES (p_user_id, p_bottle_id, p_annotation);

  SELECT '收藏成功' AS message, 1 AS success;
END //
DELIMITER ;

-- 取消收藏漂流瓶
DROP PROCEDURE IF EXISTS unsave_bottle;
DELIMITER //
CREATE PROCEDURE unsave_bottle(
  IN p_user_id INT,
  IN p_bottle_id INT
)
BEGIN
  DECLARE v_affected_rows INT;
  DECLARE v_anonymous_user_id INT DEFAULT 1;

  -- 如果用户不存在，使用匿名用户
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = v_anonymous_user_id;
  END IF;

  -- 取消收藏
  DELETE FROM user_bottle_saves
  WHERE user_id = p_user_id AND bottle_id = p_bottle_id;

  SET v_affected_rows = ROW_COUNT();

  IF v_affected_rows = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '未找到收藏记录';
  END IF;

  SELECT '取消收藏成功' AS message, 1 AS success;
END //
DELIMITER ;

-- 4. 用户认证相关逻辑 --------------------------------------------------

-- 用户注册
DROP PROCEDURE IF EXISTS register_user;
DELIMITER //
CREATE PROCEDURE register_user(
  IN p_username VARCHAR(50),
  IN p_email VARCHAR(100),
  IN p_password_hash VARCHAR(255)
)
BEGIN
  DECLARE v_username_exists INT;
  DECLARE v_email_exists INT;
  DECLARE v_user_id INT;
  DECLARE v_result_message VARCHAR(255);
  DECLARE v_success INT DEFAULT 0;

  -- 检查用户名是否已存在
  SELECT COUNT(*) INTO v_username_exists
  FROM users
  WHERE username = p_username;

  IF v_username_exists > 0 THEN
    SET v_result_message = '用户名已存在';
  ELSE
    -- 检查邮箱是否已存在（如果提供了邮箱）
    IF p_email IS NOT NULL AND p_email != '' THEN
      SELECT COUNT(*) INTO v_email_exists
      FROM users
      WHERE email = p_email;

      IF v_email_exists > 0 THEN
        SET v_result_message = '邮箱已被注册';
      END IF;
    END IF;

    -- 如果没有错误，创建用户
    IF v_result_message IS NULL THEN
      INSERT INTO users (username, email, password_hash)
      VALUES (p_username, p_email, p_password_hash);

      SET v_user_id = LAST_INSERT_ID();

      -- 创建用户状态记录
      INSERT INTO user_states (user_id) VALUES (v_user_id);

      SET v_result_message = '注册成功';
      SET v_success = 1;
    END IF;
  END IF;

  -- 返回结果
  SELECT 
    v_user_id AS userId,
    p_username AS username,
    p_email AS email,
    v_result_message AS message,
    v_success AS success;
END //
DELIMITER ;

-- 用户登录
DROP PROCEDURE IF EXISTS login_user;
DELIMITER //
CREATE PROCEDURE login_user(
  IN p_username VARCHAR(50),
  IN p_password_hash VARCHAR(255)
)
BEGIN
  DECLARE v_user_id INT;
  DECLARE v_username VARCHAR(50);
  DECLARE v_email VARCHAR(100);
  DECLARE v_db_password_hash VARCHAR(255);
  DECLARE v_is_active BOOLEAN;
  DECLARE v_result_message VARCHAR(255);
  DECLARE v_success INT DEFAULT 0;

  -- 查找用户
  SELECT 
    id, 
    username, 
    email, 
    password_hash, 
    is_active
  INTO 
    v_user_id, 
    v_username, 
    v_email, 
    v_db_password_hash, 
    v_is_active
  FROM users
  WHERE username = p_username;

  -- 检查用户是否存在
  IF v_user_id IS NULL THEN
    SET v_result_message = '用户名或密码错误';
  -- 检查用户是否激活
  ELSEIF v_is_active = FALSE THEN
    SET v_result_message = '账户已被禁用，请联系管理员';
  -- 验证密码
  ELSEIF v_db_password_hash != p_password_hash THEN
    SET v_result_message = '用户名或密码错误';
  ELSE
    -- 更新最后登录时间
    UPDATE users 
    SET last_login = NOW() 
    WHERE id = v_user_id;

    SET v_result_message = '登录成功';
    SET v_success = 1;
  END IF;

  -- 返回结果
  SELECT 
    v_user_id AS userId,
    v_username AS username,
    v_email AS email,
    v_result_message AS message,
    v_success AS success;
END //
DELIMITER ;

-- 获取用户信息
DROP PROCEDURE IF EXISTS get_user_info;
DELIMITER //
CREATE PROCEDURE get_user_info(
  IN p_user_id INT
)
BEGIN
  SELECT 
    id,
    username,
    email,
    created_at,
    last_login,
    is_active
  FROM users
  WHERE id = p_user_id;
END //
DELIMITER ;

-- 5. 管理相关逻辑 --------------------------------------------------

-- 获取系统统计信息
DROP PROCEDURE IF EXISTS get_system_stats;
DELIMITER //
CREATE PROCEDURE get_system_stats()
BEGIN
  -- 用户统计
  SELECT 
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS active_users,
    (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) AS new_users_today;
    
  -- 漂流瓶统计
  SELECT 
    (SELECT COUNT(*) FROM bottles) AS total_bottles,
    (SELECT COUNT(*) FROM bottles WHERE is_active = TRUE) AS active_bottles,
    (SELECT COUNT(*) FROM bottles WHERE DATE(created_at) = CURDATE()) AS new_bottles_today,
    (SELECT COUNT(*) FROM bottles WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY) AS new_bottles_yesterday;
    
  -- 互动统计
  SELECT 
    (SELECT COUNT(*) FROM user_bottle_reactions WHERE reaction_type = 'like') AS total_likes,
    (SELECT COUNT(*) FROM user_bottle_reactions WHERE reaction_type = 'dislike') AS total_dislikes,
    (SELECT COUNT(*) FROM user_bottle_saves) AS total_saves,
    (SELECT COUNT(*) FROM user_bottle_views) AS total_views;
    
  -- 活跃度统计
  SELECT 
    (SELECT COUNT(DISTINCT user_id) FROM user_bottle_views WHERE DATE(viewed_at) = CURDATE()) AS active_users_today,
    (SELECT COUNT(DISTINCT user_id) FROM user_bottle_views WHERE DATE(viewed_at) = CURDATE() - INTERVAL 1 DAY) AS active_users_yesterday;
END //
DELIMITER ;

-- 删除漂流瓶（软删除）
DROP PROCEDURE IF EXISTS delete_bottle;
DELIMITER //
CREATE PROCEDURE delete_bottle(
  IN p_bottle_id INT
)
BEGIN
  UPDATE bottles
  SET is_active = FALSE
  WHERE id = p_bottle_id;
  
  SELECT ROW_COUNT() AS affected_rows, '漂流瓶已删除' AS message;
END //
DELIMITER ;

-- 禁用用户
DROP PROCEDURE IF EXISTS disable_user;
DELIMITER //
CREATE PROCEDURE disable_user(
  IN p_user_id INT
)
BEGIN
  UPDATE users
  SET is_active = FALSE
  WHERE id = p_user_id AND id != 1; -- 不能禁用匿名用户
  
  SELECT ROW_COUNT() AS affected_rows, '用户已禁用' AS message;
END //
DELIMITER ;

-- 启用用户
DROP PROCEDURE IF EXISTS enable_user;
DELIMITER //
CREATE PROCEDURE enable_user(
  IN p_user_id INT
)
BEGIN
  UPDATE users
  SET is_active = TRUE
  WHERE id = p_user_id;
  
  SELECT ROW_COUNT() AS affected_rows, '用户已启用' AS message;
END //
DELIMITER ;
