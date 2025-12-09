const jwt = require('jsonwebtoken');
require('dotenv').config();

// 生成JWT令牌
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
}

// 验证JWT令牌
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 中间件：验证请求中的JWT令牌
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }

  req.user = user;
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken
};
