-- 修复record_bottle_picked存储过程
DROP PROCEDURE IF EXISTS record_bottle_picked;
DELIMITER //
CREATE PROCEDURE record_bottle_picked(
  IN p_user_id INT
)
BEGIN
  DECLARE v_today DATE DEFAULT CURDATE();
  DECLARE v_anonymous_user_id INT DEFAULT 1;
  DECLARE v_exists INT;

  -- 如果用户不存在，使用匿名用户
  IF p_user_id IS NULL OR p_user_id = 0 THEN
    SET p_user_id = v_anonymous_user_id;
  END IF;

  -- 检查用户状态是否存在
  SELECT COUNT(*) INTO v_exists
  FROM user_states
  WHERE user_id = p_user_id;

  -- 如果状态不存在，创建默认状态
  IF v_exists = 0 THEN
    INSERT INTO user_states (user_id) VALUES (p_user_id);
  END IF;

  -- 更新用户状态
  UPDATE user_states
  SET
    has_picked_today = TRUE,
    last_pick_date = v_today
  WHERE user_id = p_user_id;

  -- 返回更新后的状态
  CALL get_user_state(p_user_id);
END //
DELIMITER ;
