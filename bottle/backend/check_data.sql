-- 检查user_states表中的数据
SELECT * FROM user_states;

-- 检查表结构
DESCRIBE user_states;

-- 检查last_pick_date和last_throw_date的实际值和类型
SELECT 
  user_id,
  has_picked_today,
  has_thrown_today,
  last_pick_date,
  DATE(last_pick_date) as date_last_pick_date,
  TIME(last_pick_date) as time_last_pick_date,
  last_throw_date,
  DATE(last_throw_date) as date_last_throw_date,
  TIME(last_throw_date) as time_last_throw_date
FROM user_states;
