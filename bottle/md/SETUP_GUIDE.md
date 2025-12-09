# 漂流瓶项目设置指南

## 问题分析

在测试过程中发现写瓶子和捡起瓶子操作失败，主要原因如下：

1. **路由配置问题**：服务器中存在重复的路由注册，导致认证中间件应用不正确
2. **数据库初始化问题**：缺少必要的数据库表和存储过程
3. **认证问题**：未登录用户无法访问基本功能

## 解决方案

### 1. 数据库设置

确保MySQL已安装并运行，然后执行以下步骤：

```bash
# 进入后端目录
cd backend

# 运行数据库初始化脚本
node setup_db.js
```

或者使用启动脚本（推荐）：

```bash
# 进入后端目录
cd backend

# 给启动脚本添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 2. 后端服务器设置

1. 确保已安装所有依赖：

```bash
cd backend
npm install
```

2. 检查 `.env` 文件中的数据库配置是否正确：

```
DB_HOST=localhost
DB_USER=drift_app
DB_PASSWORD=drift_password
DB_NAME=drift_bottle
```

3. 启动服务器：

```bash
node server.js
```

### 3. 前端设置

1. 确保 `storageService.js` 中的 API_BASE_URL 正确指向后端服务器：

```javascript
static API_BASE_URL = 'http://localhost:3000/api';
```

2. 使用本地服务器打开前端文件，避免CORS问题：

```bash
# 安装http-server（如果尚未安装）
npm install -g http-server

# 在项目根目录启动服务器
http-server
```

### 4. 测试

1. 打开浏览器访问前端页面
2. 尝试创建漂流瓶（写瓶子）
3. 尝试获取随机漂流瓶（捡瓶子）

## 常见问题

### 问题1：数据库连接失败

**错误信息**：`数据库连接失败: Access denied for user`

**解决方案**：
1. 检查MySQL服务是否运行
2. 检查 `.env` 文件中的数据库用户名和密码是否正确
3. 确保数据库用户有足够的权限

### 问题2：无法创建或获取漂流瓶

**错误信息**：`401 Unauthorized` 或 `403 Forbidden`

**解决方案**：
1. 检查后端服务器是否正常运行
2. 确保路由配置正确（已修复）
3. 检查API请求是否包含正确的认证头（对于需要认证的操作）

### 问题3：CORS错误

**错误信息**：`Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`

**解决方案**：
1. 确保后端服务器启用了CORS中间件
2. 使用本地服务器打开前端文件，而不是直接打开HTML文件

## 代码修改说明

1. **修复了路由配置问题**：
   - 移除了重复的路由注册
   - 将部分漂流瓶路由设为公开路由，允许未登录用户使用

2. **添加了数据库初始化脚本**：
   - 创建了 `init_db.sql` 文件，包含所有必要的表和存储过程
   - 创建了 `setup_db.js` 脚本，用于执行SQL初始化

3. **添加了启动脚本**：
   - 创建了 `start.sh` 脚本，自动完成依赖安装、数据库初始化和服务器启动

4. **确保匿名用户可以使用基本功能**：
   - 未登录用户可以获取随机漂流瓶
   - 未登录用户可以创建漂流瓶（使用匿名用户ID）

## 后续建议

1. 添加更多的错误处理和日志记录
2. 实现数据库备份和恢复机制
3. 添加API文档，方便前端开发
4. 考虑使用Docker容器化部署，简化环境配置
