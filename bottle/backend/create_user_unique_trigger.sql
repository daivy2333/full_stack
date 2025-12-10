-- 创建用户唯一性触发器
USE drift_bottle;

-- 删除可能存在的触发器
DROP TRIGGER IF EXISTS check_user_unique;

-- 创建触发器，在插入或更新用户前检查用户名和邮箱的唯一性
DELIMITER //
CREATE TRIGGER check_user_unique
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  -- 检查用户名是否已存在
  IF EXISTS (SELECT id FROM users WHERE username = NEW.username) THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = '用户名已存在';
  END IF;

  -- 检查邮箱是否已存在（如果提供了邮箱）
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF EXISTS (SELECT id FROM users WHERE email = NEW.email) THEN
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = '邮箱已被注册';
    END IF;
  END IF;
END//
DELIMITER ;

-- 创建更新时的触发器
DROP TRIGGER IF EXISTS check_user_unique_update;

DELIMITER //
CREATE TRIGGER check_user_unique_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  -- 如果用户名被修改，检查新用户名是否已存在
  IF NEW.username != OLD.username THEN
    IF EXISTS (SELECT id FROM users WHERE username = NEW.username AND id != OLD.id) THEN
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = '用户名已存在';
    END IF;
  END IF;

  -- 如果邮箱被修改，检查新邮箱是否已存在
  IF NEW.email != OLD.email AND NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF EXISTS (SELECT id FROM users WHERE email = NEW.email AND id != OLD.id) THEN
      SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = '邮箱已被注册';
    END IF;
  END IF;
END//
DELIMITER ;
