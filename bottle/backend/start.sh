#!/bin/bash

echo "漂流瓶项目启动脚本"

# 检查Node.js是否安装
if ! command -v node &> /dev/null
then
    echo "错误: Node.js 未安装，请先安装Node.js"
    exit 1
fi

# 检查MySQL是否安装
if ! command -v mysql &> /dev/null
then
    echo "警告: MySQL 未安装，请确保MySQL已安装并运行"
fi

# 安装依赖
echo "安装Node.js依赖..."
npm install

# 初始化数据库
echo "初始化数据库..."
node setup_db.js

# 启动服务器
echo "启动服务器..."
node server.js
