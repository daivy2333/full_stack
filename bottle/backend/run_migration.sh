#!/bin/bash
echo "开始数据迁移..."
node migrate_bottles.js
echo "数据迁移完成，启动服务器..."
node server.js
