const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

// 导入路由
const authRoutes = require('./routes/auth');
const bottleRoutes = require('./routes/bottles');
const userRoutes = require('./routes/user');
const { authenticateToken } = require('./utils/jwt');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'], // 允许的前端地址
  credentials: true, // 允许发送凭证
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的HTTP方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的请求头
})); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 测试数据库连接
testConnection();

// API路由
// 公开路由（不需要认证）
app.use('/api/auth', authRoutes);

// 漂流瓶公开路由（获取和创建漂流瓶）
app.use('/api/bottles', bottleRoutes);

// 用户路由 - 部分需要认证
app.use('/api/user', userRoutes);

// 需要认证的用户路由
app.use('/api/user/saves', authenticateToken, userRoutes);
// 只对需要认证的漂流瓶操作使用认证中间件
app.post('/api/bottles/:id/react', authenticateToken, bottleRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({ message: '漂流瓶API服务正在运行' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '未找到请求的资源' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
