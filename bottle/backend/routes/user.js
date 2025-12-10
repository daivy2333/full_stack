const express = require('express');
const { pool } = require('../config/db');
const { authenticateToken } = require('../utils/jwt');

const router = express.Router();

// 获取用户状态
router.get('/state', async (req, res) => {
  try {
    // 从查询参数或认证中间件获取用户ID
    const userId = req.query.userId ? parseInt(req.query.userId) : req.user?.id;

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

    // 使用存储过程获取用户状态
    const [rows] = await pool.execute('CALL get_user_state(?)', [userId]);
    
    // 存储过程返回的结果在第二个结果集中
    const state = rows[0][0];
    
    console.log('存储过程返回的用户状态:', JSON.stringify(state, null, 2));

    // 确保日期字段以正确的格式返回
    const formatDate = (date) => {
      if (!date) return null;
      // 如果已经是字符串，直接返回
      if (typeof date === 'string') {
        return date.split('T')[0];
      }
      // 如果是Date对象，转换为ISO字符串并只取日期部分
      return date.toISOString().split('T')[0];
    };

    res.json({
      hasPickedToday: Boolean(state.hasPickedToday),
      hasThrownToday: Boolean(state.hasThrownToday),
      lastPickDate: formatDate(state.lastPickDate),
      lastThrowDate: formatDate(state.lastThrowDate),
      currentView: state.currentView,
      devMode: Boolean(state.devMode),
      hasSeenTutorial: Boolean(state.hasSeenTutorial)
    });
  } catch (error) {
    console.error('获取用户状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 记录用户已捡起漂流瓶
router.post('/pick', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    // 使用存储过程更新用户捡瓶子状态
    console.log('准备使用存储过程更新用户状态，userId:', userId);
    
    try {
      await pool.execute('CALL record_bottle_picked(?)', [userId]);
      console.log('存储过程执行成功');
    } catch (error) {
      console.error('存储过程执行失败:', error);
      throw error;
    }

    // 获取更新后的用户状态
    try {
      const [rows] = await pool.execute('CALL get_user_state(?)', [userId]);
      
      // 存储过程返回的结果在第二个结果集中
      const state = rows[0][0];
      console.log('存储过程返回的用户状态:', JSON.stringify(state, null, 2));
      
      // 确保日期字段以正确的格式返回
      const formatDate = (date) => {
        if (!date) return null;
        // 如果已经是字符串，直接返回
        if (typeof date === 'string') {
          return date.split('T')[0];
        }
        // 如果是Date对象，转换为ISO字符串并只取日期部分
        return date.toISOString().split('T')[0];
      };

      // 返回更新后的状态
      res.json({
        message: '记录成功',
        hasPickedToday: Boolean(state.hasPickedToday),
        hasThrownToday: Boolean(state.hasThrownToday),
        lastPickDate: formatDate(state.lastPickDate),
        lastThrowDate: formatDate(state.lastThrowDate),
        currentView: state.currentView,
        devMode: Boolean(state.devMode),
        hasSeenTutorial: Boolean(state.hasSeenTutorial)
      });
    } catch (error) {
      console.error('获取用户状态失败:', error);
      throw error;
    }
    

  } catch (error) {
    console.error('记录捡瓶子错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新用户状态
router.put('/state', authenticateToken, async (req, res) => {
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

    // 使用存储过程更新用户状态
    await pool.execute('CALL update_user_state(?, ?, ?, ?, ?, ?, ?, ?)', [
      userId,
      updates.has_picked_today !== undefined ? updates.has_picked_today : null,
      updates.has_thrown_today !== undefined ? updates.has_thrown_today : null,
      updates.last_pick_date !== undefined ? updates.last_pick_date : null,
      updates.last_throw_date !== undefined ? updates.last_throw_date : null,
      updates.current_view !== undefined ? updates.current_view : null,
      updates.dev_mode !== undefined ? updates.dev_mode : null,
      updates.has_seen_tutorial !== undefined ? updates.has_seen_tutorial : null
    ]);

    // 返回更新后的状态
    const [rows] = await pool.execute('CALL get_user_state(?)', [userId]);
    
    // 存储过程返回的结果在第二个结果集中
    const state = rows[0][0];

    // 确保日期字段以正确的格式返回
    const formatDate = (date) => {
      if (!date) return null;
      // 如果已经是字符串，直接返回
      if (typeof date === 'string') {
        return date.split('T')[0];
      }
      // 如果是Date对象，转换为ISO字符串并只取日期部分
      return date.toISOString().split('T')[0];
    };

    res.json({
      hasPickedToday: Boolean(state.hasPickedToday),
      hasThrownToday: Boolean(state.hasThrownToday),
      lastPickDate: formatDate(state.lastPickDate),
      lastThrowDate: formatDate(state.lastThrowDate),
      currentView: state.currentView,
      devMode: Boolean(state.devMode),
      hasSeenTutorial: Boolean(state.hasSeenTutorial)
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户收藏的漂流瓶
router.get('/saves', authenticateToken, async (req, res) => {
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
router.post('/saves', authenticateToken, async (req, res) => {
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
router.delete('/saves/:bottleId', authenticateToken, async (req, res) => {
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
