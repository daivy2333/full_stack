# 漂流瓶项目数据库架构设计

## 当前数据结构分析

### 1. 漂流瓶数据结构
基于bottles.json文件，漂流瓶的数据结构如下：
```json
{
  "id": 1,                    // 漂流瓶唯一标识
  "message": "消息内容",       // 漂流瓶消息内容
  "author": "匿名用户",        // 作者名称
  "date": "2023-05-15",       // 创建日期
  "likes": 12,                // 点赞数
  "dislikes": 3,              // 点踩数
  "views": 156                // 浏览次数
}
```

### 2. 用户状态数据结构
基于storageService.js，用户状态包含：
```json
{
  "hasPickedToday": false,    // 今日是否已捡瓶子
  "hasThrownToday": false,    // 今日是否已投瓶子
  "lastPickDate": null,       // 上次捡瓶子的日期
  "lastThrowDate": null,      // 上次投瓶子的日期
  "currentView": "pick",      // 当前视图模式（pick/write）
  "devMode": false,           // 开发者模式标志
  "viewedBottles": [],        // 用户已看过的漂流瓶ID列表
  "hasSeenTutorial": false,   // 是否已看过教程
  "currentBottle": null       // 当前瓶子状态
}
```

### 3. 用户收藏的漂流瓶数据结构
```json
{
  "id": 1,                    // 漂流瓶ID
  "message": "消息内容",       // 漂流瓶消息内容
  "author": "匿名用户",        // 作者名称
  "date": "2023-05-15",       // 创建日期
  "likes": 12,                // 点赞数
  "dislikes": 3,              // 点踩数
  "views": 156,               // 浏览次数
  "savedDate": "2023-05-16",  // 收藏日期
  "annotation": "标注内容"     // 用户添加的标注（最多10个字）
}
```

## MySQL数据库设计

### 1. 用户表 (users)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

### 2. 漂流瓶表 (bottles)
```sql
CREATE TABLE bottles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,           -- 关联用户ID
  message TEXT NOT NULL,          -- 漂流瓶消息内容
  author_name VARCHAR(50),         -- 显示的作者名称（可以是昵称）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  views INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,  -- 是否有效（用于软删除）
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. 用户状态表 (user_states)
```sql
CREATE TABLE user_states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,    -- 关联用户ID
  has_picked_today BOOLEAN DEFAULT FALSE,
  has_thrown_today BOOLEAN DEFAULT FALSE,
  last_pick_date DATE NULL,
  last_throw_date DATE NULL,
  current_view ENUM('pick', 'write') DEFAULT 'pick',
  dev_mode BOOLEAN DEFAULT FALSE,
  has_seen_tutorial BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4. 用户浏览记录表 (user_bottle_views)
```sql
CREATE TABLE user_bottle_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bottle_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_bottle (user_id, bottle_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);
```

### 5. 用户收藏表 (user_bottle_saves)
```sql
CREATE TABLE user_bottle_saves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bottle_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  annotation VARCHAR(10),        -- 用户添加的标注（最多10个字）
  UNIQUE KEY unique_user_bottle (user_id, bottle_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);
```

### 6. 用户点赞/点踩表 (user_bottle_reactions)
```sql
CREATE TABLE user_bottle_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bottle_id INT NOT NULL,
  reaction_type ENUM('like', 'dislike') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_bottle (user_id, bottle_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);
```

## 需要更改的代码

### 1. 后端API设计

#### 用户认证相关API
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 用户登出
- GET /api/auth/profile - 获取用户信息

#### 漂流瓶相关API
- GET /api/bottles - 获取漂流瓶列表
- GET /api/bottles/random - 随机获取一个未看过的漂流瓶
- POST /api/bottles - 创建新漂流瓶
- GET /api/bottles/:id - 获取特定漂流瓶详情
- POST /api/bottles/:id/react - 对漂流瓶进行点赞/点踩

#### 用户状态相关API
- GET /api/user/state - 获取用户状态
- PUT /api/user/state - 更新用户状态

#### 收藏相关API
- GET /api/user/saves - 获取用户收藏的漂流瓶
- POST /api/user/saves - 收藏漂流瓶
- DELETE /api/user/saves/:bottleId - 取消收藏漂流瓶

### 2. 前端代码修改

#### storageService.js
- 将localStorage操作替换为API调用
- 实现token管理，用于用户认证

#### bottleService.js
- 修改loadBottles方法，从API获取数据
- 修改createBottle方法，通过API创建漂流瓶
- 修改saveBottle方法，通过API保存收藏

#### appController.js
- 添加用户认证相关逻辑
- 修改各种状态管理，与后端API同步
- 处理API错误情况

#### uiController.js
- 添加登录/注册界面
- 添加用户信息显示区域
- 处理网络请求错误提示

### 3. 数据迁移策略
1. 创建数据库和表结构
2. 将bottles.json中的数据导入到bottles表
3. 为现有用户创建匿名账号，迁移localStorage中的数据

## 实现步骤

1. **设计并创建数据库**
   - 创建MySQL数据库
   - 创建所有必要的表
   - 设置适当的索引和外键约束

2. **开发后端API**
   - 实现用户认证系统
   - 实现漂流瓶相关API
   - 实现用户状态和收藏相关API

3. **修改前端代码**
   - 替换localStorage为API调用
   - 添加用户认证界面
   - 适配新的数据结构

4. **测试与优化**
   - 测试所有功能
   - 性能优化
   - 安全性检查

5. **部署上线**
   - 部署后端服务
   - 配置数据库连接
   - 前端代码部署

## 注意事项

1. **安全性**
   - 实现密码哈希存储
   - 使用JWT进行用户认证
   - 防止SQL注入攻击

2. **性能优化**
   - 为常用查询添加索引
   - 实现分页加载
   - 缓存热门漂流瓶

3. **扩展性**
   - 设计支持水平扩展的架构
   - 考虑未来功能扩展的可能性

4. **数据一致性**
   - 使用事务确保关键操作的原子性
   - 实现适当的并发控制
