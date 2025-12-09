const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// 获取随机漂流瓶（用户未看过的）
router.get('/random', async (req, res) => {
  try {
    const userId = req.user?.id;

    let query;
    let params = [];

    if (userId) {
      // 如果用户已登录，获取用户未看过的漂流瓶
      query = `
        CALL get_random_unseen_bottle(?)
      `;
      params = [userId];
    } else {
      // 如果用户未登录，随机获取一个漂流瓶
      query = `
        SELECT b.*, u.username
        FROM bottles b
        JOIN users u ON b.user_id = u.id
        WHERE b.is_active = TRUE
        ORDER BY RAND()
        LIMIT 1
      `;
    }

    const [rows] = await pool.execute(query, params);

    // 如果是存储过程调用，结果在第一个元素中
    const bottles = Array.isArray(rows[0]) ? rows[0] : rows;

    if (bottles.length === 0) {
      return res.status(404).json({ error: '没有可用的漂流瓶' });
    }

    const bottle = bottles[0];

    // 如果用户已登录，记录浏览
    if (userId) {
      await pool.execute(
        'INSERT INTO user_bottle_views (user_id, bottle_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE viewed_at = NOW()',
        [userId, bottle.id]
      );

      // 增加浏览次数
      await pool.execute(
        'UPDATE bottles SET views = views + 1 WHERE id = ?',
        [bottle.id]
      );
    }

    // 获取点赞和点踩数
    const [reactionRows] = await pool.execute(
      `SELECT 
        reaction_type,
        COUNT(*) as count
      FROM user_bottle_reactions
      WHERE bottle_id = ?
      GROUP BY reaction_type`,
      [bottle.id]
    );

    // 格式化反应数据
    const reactions = {
      like: 0,
      dislike: 0
    };

    reactionRows.forEach(row => {
      reactions[row.reaction_type] = row.count;
    });

    // 检查当前用户是否已点赞或点踩
    let userReaction = null;
    if (userId) {
      const [userReactionRows] = await pool.execute(
        'SELECT reaction_type FROM user_bottle_reactions WHERE user_id = ? AND bottle_id = ?',
        [userId, bottle.id]
      );

      if (userReactionRows.length > 0) {
        userReaction = userReactionRows[0].reaction_type;
      }
    }

    // 返回格式化的漂流瓶数据
    res.json({
      id: bottle.id,
      message: bottle.message,
      author: bottle.author_name || bottle.username,
      date: bottle.created_at.toISOString().split('T')[0],
      likes: reactions.like,
      dislikes: reactions.dislike,
      views: bottle.views,
      userReaction // 当前用户的反应（like/dislike/null）
    });
  } catch (error) {
    console.error('获取随机漂流瓶错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建新漂流瓶
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { message, authorName } = req.body;

    // 验证输入
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: '消息内容不能超过500个字符' });
    }

    // 如果用户未登录，使用默认用户ID（可以创建一个匿名用户）
    let actualUserId = userId;
    if (!userId) {
      // 这里可以创建或获取一个匿名用户ID
      // 简化处理，使用固定ID
      actualUserId = 1;
    }

    // 创建漂流瓶
    const [result] = await pool.execute(
      'INSERT INTO bottles (user_id, message, author_name) VALUES (?, ?, ?)',
      [actualUserId, message, authorName || '匿名用户']
    );

    // 获取新创建的漂流瓶
    const [rows] = await pool.execute(
      'SELECT * FROM bottles WHERE id = ?',
      [result.insertId]
    );

    if (rows.length === 0) {
      return res.status(500).json({ error: '创建漂流瓶失败' });
    }

    const bottle = rows[0];

    // 返回格式化的漂流瓶数据
    res.status(201).json({
      id: bottle.id,
      message: bottle.message,
      author: bottle.author_name,
      date: bottle.created_at.toISOString().split('T')[0],
      likes: bottle.likes,
      dislikes: bottle.dislikes,
      views: bottle.views
    });
  } catch (error) {
    console.error('创建漂流瓶错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 对漂流瓶进行反应（点赞/点踩）
router.post('/:id/react', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { reactionType } = req.body; // 'like' 或 'dislike'
    const bottleId = req.params.id;

    // 验证输入
    if (!userId) {
      return res.status(401).json({ error: '请先登录' });
    }

    if (!['like', 'dislike'].includes(reactionType)) {
      return res.status(400).json({ error: '无效的反应类型' });
    }

    // 检查漂流瓶是否存在
    const [bottleRows] = await pool.execute(
      'SELECT id FROM bottles WHERE id = ? AND is_active = TRUE',
      [bottleId]
    );

    if (bottleRows.length === 0) {
      return res.status(404).json({ error: '漂流瓶不存在' });
    }

    // 检查用户是否已经对该漂流瓶做出反应
    const [reactionRows] = await pool.execute(
      'SELECT reaction_type FROM user_bottle_reactions WHERE user_id = ? AND bottle_id = ?',
      [userId, bottleId]
    );

    if (reactionRows.length > 0) {
      // 如果用户已经做出反应，更新反应类型
      await pool.execute(
        'UPDATE user_bottle_reactions SET reaction_type = ?, created_at = NOW() WHERE user_id = ? AND bottle_id = ?',
        [reactionType, userId, bottleId]
      );
    } else {
      // 如果用户还没有做出反应，创建新的反应记录
      await pool.execute(
        'INSERT INTO user_bottle_reactions (user_id, bottle_id, reaction_type) VALUES (?, ?, ?)',
        [userId, bottleId, reactionType]
      );
    }

    // 获取更新后的点赞和点踩数
    const [statsRows] = await pool.execute(
      `SELECT 
        COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as likes,
        COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) as dislikes
      FROM user_bottle_reactions
      WHERE bottle_id = ?`,
      [bottleId]
    );

    const stats = statsRows[0];

    res.json({
      message: '反应已记录',
      likes: stats.likes,
      dislikes: stats.dislikes,
      userReaction: reactionType
    });
  } catch (error) {
    console.error('漂流瓶反应错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取漂流瓶详情
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const bottleId = req.params.id;

    // 获取漂流瓶信息
    const [bottleRows] = await pool.execute(
      `SELECT b.*, u.username
      FROM bottles b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ? AND b.is_active = TRUE`,
      [bottleId]
    );

    if (bottleRows.length === 0) {
      return res.status(404).json({ error: '漂流瓶不存在' });
    }

    const bottle = bottleRows[0];

    // 获取点赞和点踩数
    const [reactionRows] = await pool.execute(
      `SELECT 
        reaction_type,
        COUNT(*) as count
      FROM user_bottle_reactions
      WHERE bottle_id = ?
      GROUP BY reaction_type`,
      [bottleId]
    );

    // 格式化反应数据
    const reactions = {
      like: 0,
      dislike: 0
    };

    reactionRows.forEach(row => {
      reactions[row.reaction_type] = row.count;
    });

    // 检查当前用户是否已点赞或点踩
    let userReaction = null;
    if (userId) {
      const [userReactionRows] = await pool.execute(
        'SELECT reaction_type FROM user_bottle_reactions WHERE user_id = ? AND bottle_id = ?',
        [userId, bottleId]
      );

      if (userReactionRows.length > 0) {
        userReaction = userReactionRows[0].reaction_type;
      }
    }

    // 返回格式化的漂流瓶数据
    res.json({
      id: bottle.id,
      message: bottle.message,
      author: bottle.author_name || bottle.username,
      date: bottle.created_at.toISOString().split('T')[0],
      likes: reactions.like,
      dislikes: reactions.dislike,
      views: bottle.views,
      userReaction // 当前用户的反应（like/dislike/null）
    });
  } catch (error) {
    console.error('获取漂流瓶详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
