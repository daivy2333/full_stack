const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

async function migrateBottlesFromJson() {
  try {
    console.log('开始迁移漂流瓶数据...');

    // 读取 JSON 文件
    const jsonPath = path.join(__dirname, '..', 'bottles.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const bottles = jsonData.bottles;

    console.log(`找到 ${bottles.length} 个漂流瓶需要迁移`);

    // 为每个漂流瓶创建数据库记录
    for (const bottle of bottles) {
      // 使用匿名用户ID (1) 作为所有漂流瓶的user_id
      // 在实际应用中，可能需要根据作者名称创建或查找对应的用户

      // 格式化日期
      const createdAt = new Date(bottle.date);

      // 插入漂流瓶记录
      const [result] = await pool.execute(
        `INSERT INTO bottles (user_id, message, author_name, created_at, likes, dislikes, views, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1, // 使用匿名用户ID
          bottle.message,
          bottle.author,
          createdAt,
          bottle.likes || 0,
          bottle.dislikes || 0,
          bottle.views || 0,
          true // is_active
        ]
      );

      console.log(`已迁移漂流瓶 ID: ${result.insertId}, 消息: "${bottle.message.substring(0, 20)}..."`);
    }

    console.log('漂流瓶数据迁移完成!');

    // 关闭数据库连接
    await pool.end();

  } catch (error) {
    console.error('迁移过程中出错:', error);
    process.exit(1);
  }
}

// 执行迁移
migrateBottlesFromJson();
