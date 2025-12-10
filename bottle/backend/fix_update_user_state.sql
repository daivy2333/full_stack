-- 修复update_user_state存储过程
DROP PROCEDURE IF EXISTS update_user_state;
DELIMITER //
CREATE PROCEDURE update_user_state(
  IN p_user_id INT,
  IN p_has_picked_today BOOLEAN,
  IN p_has_thrown_today BOOLEAN,
  IN p_last_pick_date DATE,
  IN p_last_throw_date DATE,
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
      WHEN p_last_pick_date IS NOT NULL THEN p_last_pick_date
      ELSE last_pick_date
    END,
    last_throw_date = CASE
      WHEN p_last_throw_date IS NOT NULL THEN p_last_throw_date
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
