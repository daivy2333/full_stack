修复了路由注册问题：

在 server.js 中，将错误的 app.get('/api/bottles/random', bottleRoutes) 等路由注册方式改为正确的 app.use('/api/bottles', bottleRoutes)，这样服务器才能正确处理 /api/bottles/random 请求。
创建了数据迁移脚本：

创建了 migrate_bottles.js 脚本，用于将 bottles.json 文件中的漂流瓶数据迁移到数据库中。
该脚本会读取 JSON 文件，并将每个漂流瓶插入到数据库的 bottles 表中。
创建了运行脚本：

创建了 run_migration.bat（Windows 版本）和 run_migration.sh（Linux/Mac 版本）脚本，方便一键执行数据迁移和启动服务器。
使用方法：

确保数据库已正确创建（运行 setup_db.js 或 init_db.sql）
在命令行中进入 backend 目录
运行 run_migration.bat（Windows）或 run_migration.sh（Linux/Mac）
脚本会先执行数据迁移，然后启动服务器
数据迁移完成后，数据库中将包含 bottles.json 中的所有漂流瓶数据，这样当用户请求随机漂流瓶时，服务器就能返回有效的数据，而不是"没有可用的漂流瓶"错误。

如果您需要单独运行迁移脚本而不启动服务器，可以直接运行 node migrate_bottles.js