const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// 获取用户状态
router.get('/state', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      // 如果用户未登录，返回默认状态
      return res.json({
        hasPickedToday: false,
        hasThrownToday: false,
        lastPickDate: null,
        lastThrowDate: null,
        currentView: 'pick',
        devMode: false,
        hasSeenTutorial: false
      });
    }

    // 获取用户状态
    const [rows] = await pool.execute(
      'SELECT * FROM user_states WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      // 如果状态不存在，创建默认状态
      await pool.execute(
        'INSERT INTO user_states (user_id) VALUES (?)',
        [userId]
      );

      return res.json({
        hasPickedToday: false,
        hasThrownToday: false,
        lastPickDate: null,
        lastThrowDate: null,
        currentView: 'pick',
        devMode: false,
        hasSeenTutorial: false
      });
    }

    const state = rows[0];

    // 检查日期是否变化
    const today = new Date().toISOString().split('T')[0];
    const hasPickedToday = state.last_pick_date === today && state.has_picked_today;
    const hasThrownToday = state.last_throw_date === today && state.has_thrown_today;

    // 如果日期变化，重置状态
    if (state.last_pick_date !== today && state.has_picked_today) {
      await pool.execute(
        'UPDATE user_states SET has_picked_today = 0 WHERE user_id = ?',
        [userId]
      );
    }

    if (state.last_throw_date !== today && state.has_thrown_today) {
      await pool.execute(
        'UPDATE user_states SET has_thrown_today = 0 WHERE user_id = ?',
        [userId]
      );
    }

    res.json({
      hasPickedToday,
      hasThrownToday,
      lastPickDate: state.last_pick_date,
      lastThrowDate: state.last_throw_date,
      currentView: state.current_view,
      devMode: state.dev_mode,
      hasSeenTutorial: state.has_seen_tutorial
    });
  } catch (error) {
    console.error('获取用户状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新用户状态
router.put('/state', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    const {
      hasPickedToday,
      hasThrownToday,
      currentView,
      devMode,
      hasSeenTutorial
    } = req.body;

    // 获取当前日期
    const today = new Date().toISOString().split('T')[0];

    // 准备更新字段
    const updates = {};
    const params = [];

    // 处理捡瓶子状态
    if (hasPickedToday !== undefined) {
      updates.has_picked_today = hasPickedToday;
      updates.last_pick_date = hasPickedToday ? today : null;
    }

    // 处理投瓶子状态
    if (hasThrownToday !== undefined) {
      updates.has_thrown_today = hasThrownToday;
      updates.last_throw_date = hasThrownToday ? today : null;
    }

    // 处理当前视图
    if (currentView !== undefined && ['pick', 'write'].includes(currentView)) {
      updates.current_view = currentView;
    }

    // 处理开发者模式
    if (devMode !== undefined) {
      updates.dev_mode = devMode;
    }

    // 处理教程状态
    if (hasSeenTutorial !== undefined) {
      updates.has_seen_tutorial = hasSeenTutorial;
    }

    // 构建SQL查询
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(userId);

    // 更新用户状态
    await pool.execute(
      `UPDATE user_states SET ${setClause} WHERE user_id = ?`,
      values
    );

    // 返回更新后的状态
    const [rows] = await pool.execute(
      'SELECT * FROM user_states WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用户状态不存在' });
    }

    const state = rows[0];

    res.json({
      hasPickedToday: state.has_picked_today && state.last_pick_date === today,
      hasThrownToday: state.has_thrown_today && state.last_throw_date === today,
      lastPickDate: state.last_pick_date,
      lastThrowDate: state.last_throw_date,
      currentView: state.current_view,
      devMode: state.dev_mode,
      hasSeenTutorial: state.has_seen_tutorial
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户收藏的漂流瓶
router.get('/saves', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    // 获取用户收藏的漂流瓶
    const [rows] = await pool.execute(
      `SELECT 
        b.id,
        b.message,
        b.author_name,
        b.created_at,
        b.views,
        s.saved_at,
        s.annotation,
        COUNT(CASE WHEN r.reaction_type = 'like' THEN 1 END) as like_count,
        COUNT(CASE WHEN r.reaction_type = 'dislike' THEN 1 END) as dislike_count
      FROM user_bottle_saves s
      JOIN bottles b ON s.bottle_id = b.id
      LEFT JOIN user_bottle_reactions r ON b.id = r.bottle_id
      WHERE s.user_id = ? AND b.is_active = TRUE
      GROUP BY b.id, b.message, b.author_name, b.created_at, b.views, s.saved_at, s.annotation
      ORDER BY s.saved_at DESC`,
      [userId]
    );

    // 格式化数据
    const savedBottles = rows.map(row => ({
      id: row.id,
      message: row.message,
      author: row.author_name,
      date: row.created_at.toISOString().split('T')[0],
      likes: row.like_count,
      dislikes: row.dislike_count,
      views: row.views,
      savedDate: row.saved_at.toISOString().split('T')[0],
      annotation: row.annotation
    }));

    res.json(savedBottles);
  } catch (error) {
    console.error('获取用户收藏错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 收藏漂流瓶
router.post('/saves', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bottleId, annotation } = req.body;

    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    if (!bottleId) {
      return res.status(400).json({ error: '漂流瓶ID不能为空' });
    }

    // 检查漂流瓶是否存在
    const [bottleRows] = await pool.execute(
      'SELECT id FROM bottles WHERE id = ? AND is_active = TRUE',
      [bottleId]
    );

    if (bottleRows.length === 0) {
      return res.status(404).json({ error: '漂流瓶不存在' });
    }

    // 检查是否已经收藏过
    const [saveRows] = await pool.execute(
      'SELECT id FROM user_bottle_saves WHERE user_id = ? AND bottle_id = ?',
      [userId, bottleId]
    );

    if (saveRows.length > 0) {
      return res.status(400).json({ error: '已经收藏过这个漂流瓶' });
    }

    // 收藏漂流瓶
    await pool.execute(
      'INSERT INTO user_bottle_saves (user_id, bottle_id, annotation) VALUES (?, ?, ?)',
      [userId, bottleId, annotation ? annotation.substring(0, 10) : null]
    );

    res.status(201).json({ message: '收藏成功' });
  } catch (error) {
    console.error('收藏漂流瓶错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 取消收藏漂流瓶
router.delete('/saves/:bottleId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const bottleId = req.params.bottleId;

    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    // 取消收藏
    const [result] = await pool.execute(
      'DELETE FROM user_bottle_saves WHERE user_id = ? AND bottle_id = ?',
      [userId, bottleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '未找到收藏记录' });
    }

    res.json({ message: '取消收藏成功' });
  } catch (error) {
    console.error('取消收藏错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
