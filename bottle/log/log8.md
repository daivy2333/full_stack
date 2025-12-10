api.js:34 
 GET http://localhost:3000/api/user/state?userId=2 500 (Internal Server Error)
request	@	api.js:34
getUserState	@	api.js:84
loadUserState	@	bottle.js:94
init	@	bottle.js:80
BottleManager	@	bottle.js:24
(anonymous)	@	bottle.js:488
api.js:35 响应状态: 500
api.js:38 响应数据: 
{error: '服务器内部错误'}
api.js:52 API请求错误: Error: 请求失败
    at BottleAPI.request (api.js:47:15)
    at async BottleManager.loadUserState (bottle.js:94:24)
    at async BottleManager.init (bottle.js:80:7)
request	@	api.js:52
await in request		
getUserState	@	api.js:84
loadUserState	@	bottle.js:94
init	@	bottle.js:80
BottleManager	@	bottle.js:24
(anonymous)	@	bottle.js:488
bottle.js:106 加载用户状态失败: Error: 请求失败
    at BottleAPI.request (api.js:47:15)
    at async BottleManager.loadUserState (bottle.js:94:24)
    at async BottleManager.init (bottle.js:80:7)
loadUserState	@	bottle.js:106
await in loadUserState		
init	@	bottle.js:80
BottleManager	@	bottle.js:24
(anonymous)	@	bottle.js:488
bottle.js:241 当前用户ID: 2
bottle.js:242 正在获取随机漂流瓶...
api.js:104 API请求: 获取随机漂流瓶, userId: 2
api.js:106 请求端点: bottles/random?userId=2
api.js:30 发送请求到: http://localhost:3000/api/bottles/random?userId=2
api.js:31 请求方法: GET
api.js:32 请求数据: null
api.js:108 API请求结果: 
Promise {<pending>}
api.js:35 响应状态: 200
api.js:38 响应数据: 
{id: 24, message: '这次去了成都，大熊猫真的太可爱了！还有火锅和串串香，辣得过瘾，吃得满足，不愧是美食之都。', author: '诗意栖居', date: '2024-12-15', likes: 0, …}
bottle.js:244 获取到的漂流瓶数据: 
{id: 24, message: '这次去了成都，大熊猫真的太可爱了！还有火锅和串串香，辣得过瘾，吃得满足，不愧是美食之都。', author: '诗意栖居', date: '2024-12-15', likes: 0, …}
api.js:30 发送请求到: http://localhost:3000/api/user/pick
api.js:31 请求方法: POST
api.js:32 请求数据: 
{userId: 2}
api.js:34 
 POST http://localhost:3000/api/user/pick 500 (Internal Server Error)
request	@	api.js:34
recordBottlePicked	@	api.js:97
pickBottle	@	bottle.js:260
await in pickBottle		
(anonymous)	@	bottle.js:61
api.js:35 响应状态: 500
api.js:38 响应数据: 
{error: '服务器内部错误'}
api.js:52 API请求错误: Error: 请求失败
    at BottleAPI.request (api.js:47:15)
    at async BottleManager.pickBottle (bottle.js:260:26)
request	@	api.js:52
await in request		
recordBottlePicked	@	api.js:97
pickBottle	@	bottle.js:260
await in pickBottle		
(anonymous)	@	bottle.js:61
bottle.js:283 捡瓶子失败: Error: 请求失败
    at BottleAPI.request (api.js:47:15)
    at async BottleManager.pickBottle (bottle.js:260:26)
pickBottle	@	bottle.js:283
await in pickBottle		
(anonymous)	@	bottle.js:61

服务器运行在端口 3000
数据库连接成功
获取用户状态错误: TypeError: state.last_pick_date.split is not a function
    at /home/daivy/projects/full_stack/bottle/backend/routes/user.js:54:70
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
记录捡瓶子错误: TypeError: state.last_pick_date.split is not a function
    at /home/daivy/projects/full_stack/bottle/backend/routes/user.js:120:103
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
获取用户状态错误: TypeError: state.last_pick_date.split is not a function
    at /home/daivy/projects/full_stack/bottle/backend/routes/user.js:54:70
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
获取用户状态错误: TypeError: state.last_pick_date.split is not a function
    at /home/daivy/projects/full_stack/bottle/backend/routes/user.js:54:70
    at processTicksAndRejections (node:internal/process/task_queues:96:5)