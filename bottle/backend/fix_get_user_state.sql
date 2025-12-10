-- 修复get_user_state存储过程
DROP PROCEDURE IF EXISTS get_user_state;
DELIMITER //
CREATE PROCEDURE get_user_state(
  IN p_user_id INT
)
BEGIN
  DECLARE v_today DATE DEFAULT CURDATE();
  DECLARE v_state_exists INT;
  DECLARE v_anonymous_user_id INT DEFAULT 1;
  DECLARE v_last_pick_date DATE;
  DECLARE v_last_throw_date DATE;

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

  -- 获取用户当前日期
  SELECT last_pick_date, last_throw_date INTO v_last_pick_date, v_last_throw_date
  FROM user_states
  WHERE user_id = p_user_id;

  -- 检查日期是否变化，如果变化则重置状态
  IF v_last_pick_date IS NOT NULL AND v_last_pick_date != v_today THEN
    UPDATE user_states
    SET has_picked_today = FALSE
    WHERE user_id = p_user_id;
  END IF;

  IF v_last_throw_date IS NOT NULL AND v_last_throw_date != v_today THEN
    UPDATE user_states
    SET has_thrown_today = FALSE
    WHERE user_id = p_user_id;
  END IF;

  -- 返回用户状态
  SELECT
    IF(has_picked_today AND last_pick_date = v_today, TRUE, FALSE) AS hasPickedToday,
    IF(has_thrown_today AND last_throw_date = v_today, TRUE, FALSE) AS hasThrownToday,
    DATE_FORMAT(last_pick_date, "%Y-%m-%d") AS lastPickDate,
    DATE_FORMAT(last_throw_date, "%Y-%m-%d") AS lastThrowDate,
    current_view AS currentView,
    dev_mode AS devMode,
    has_seen_tutorial AS hasSeenTutorial
  FROM user_states
  WHERE user_id = p_user_id;
END //
DELIMITER ;
