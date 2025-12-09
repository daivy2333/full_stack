const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// 数据库连接配置（不指定数据库，用于创建数据库）
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'drift_app',
  password: process.env.DB_PASSWORD || 'drift_password'
};

async function setupDatabase() {
  try {
    console.log('连接到MySQL服务器...');
    const connection = await mysql.createConnection(connectionConfig);

    console.log('读取SQL初始化文件...');
    const sql = fs.readFileSync('./init_db.sql', 'utf8');

    console.log('执行SQL初始化脚本...');
    await connection.query(sql);

    console.log('数据库初始化完成！');

    // 关闭连接
    await connection.end();

    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 执行初始化
setupDatabase();
