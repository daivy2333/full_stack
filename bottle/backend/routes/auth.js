const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/jwt');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: '用户名长度必须在3-50个字符之间' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少为6个字符' });
    }

    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 检查用户名是否已存在
    const [usernameRows] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (usernameRows.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    if (email) {
      const [emailRows] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (emailRows.length > 0) {
        return res.status(400).json({ error: '邮箱已被注册' });
      }
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // 创建用户状态记录
    await pool.execute(
      'INSERT INTO user_states (user_id) VALUES (?)',
      [result.insertId]
    );

    // 生成JWT令牌
    const token = generateToken({ id: result.insertId, username });

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: result.insertId,
        username,
        email
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查找用户
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, is_active FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = rows[0];

    // 检查用户是否激活
    if (!user.is_active) {
      return res.status(401).json({ error: '账户已被禁用' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // 生成JWT令牌
    const token = generateToken({ id: user.id, username: user.username });

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    // 这个路由需要通过authenticateToken中间件
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT id, username, email, created_at, last_login FROM users WHERE id = ? AND is_active = TRUE',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      user: rows[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
