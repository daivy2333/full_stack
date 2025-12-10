:5500/favicon.ico:1 
 Failed to load resource: the server responded with a status of 404 (Not Found)
api.js:29 
 POST http://localhost:3000/api/user/pick 401 (Unauthorized)
request	@	api.js:29
recordBottlePicked	@	api.js:83
pickBottle	@	bottle.js:249
await in pickBottle		
(anonymous)	@	bottle.js:61
api.js:38 API请求错误: Error: 请求失败
    at BottleAPI.request (api.js:33:15)
    at async BottleManager.pickBottle (bottle.js:249:7)
request	@	api.js:38
await in request		
recordBottlePicked	@	api.js:83
pickBottle	@	bottle.js:249
await in pickBottle		
(anonymous)	@	bottle.js:61
bottle.js:261 捡瓶子失败: Error: 请求失败
    at BottleAPI.request (api.js:33:15)
    at async BottleManager.pickBottle (bottle.js:249:7)
pickBottle	@	bottle.js:261
await in pickBottle		
(anonymous)	@	bottle.js:61
api.js:29 
 PUT http://localhost:3000/api/user/state 401 (Unauthorized)
request	@	api.js:29
updateUserState	@	api.js:75
updateUserState	@	bottle.js:214
toggleView	@	bottle.js:163
(anonymous)	@	bottle.js:72
api.js:38 API请求错误: Error: 请求失败
    at BottleAPI.request (api.js:33:15)
    at async BottleManager.updateUserState (bottle.js:214:7)
    at async BottleManager.toggleView (bottle.js:163:5)
request	@	api.js:38
await in request		
updateUserState	@	api.js:75
updateUserState	@	bottle.js:214
toggleView	@	bottle.js:163
(anonymous)	@	bottle.js:72
bottle.js:216 更新用户状态失败: Error: 请求失败
    at BottleAPI.request (api.js:33:15)
    at async BottleManager.updateUserState (bottle.js:214:7)
    at async BottleManager.toggleView (bottle.js:163:5)
updateUserState	@	bottle.js:216
await in updateUserState		
toggleView	@	bottle.js:163
(anonymous)	@	bottle.js:72
api.js:29 
 PUT http://localhost:3000/api/user/state 401 (Unauthorized)
request	@	api.js:29
updateUserState	@	api.js:75
updateUserState	@	bottle.js:214
throwBottle	@	bottle.js:433
await in throwBottle		
(anonymous)	@	bottle.js:69
api.js:38 API请求错误: Error: 请求失败
    at BottleAPI.request (api.js:33:15)
    at async BottleManager.updateUserState (bottle.js:214:7)
    at async BottleManager.throwBottle (bottle.js:433:9)
request	@	api.js:38
await in request		
updateUserState	@	api.js:75
updateUserState	@	bottle.js:214
throwBottle	@	bottle.js:433
await in throwBottle		
(anonymous)	@	bottle.js:69
bottle.js:216 更新用户状态失败: Error: 请求失败
    at BottleAPI.request (api.js:33:15)
    at async BottleManager.updateUserState (bottle.js:214:7)
    at async BottleManager.throwBottle (bottle.js:433:9)
updateUserState	@	bottle.js:216
await in updateUserState		
throwBottle	@	bottle.js:433
await in throwBottle		
(anonymous)	@	bottle.js:69

POST http://localhost:3000/api/login_user 404 (Not Found)
request @ api.js:29
loginUser @ api.js:63
handleLogin @ auth.js:169
(anonymous) @ auth.js:57
api.js:44 API请求错误: Error: 请求失败
    at BottleAPI.request (api.js:39:15)
    at async AuthManager.handleLogin (auth.js:169:24)
request @ api.js:44
await in request
loginUser @ api.js:63
handleLogin @ auth.js:169
(anonymous) @ auth.js:57
auth.js:194 登录错误: Error: 请求失败
    at BottleAPI.request (api.js:39:15)
    at async AuthManager.handleLogin (auth.js:169:24)
handleLogin @ auth.js:194
await in handleLogin
(anonymous) @ auth.js:57
api.js:29  POST http://localhost:3000/api/register_user 404 (Not Found)
request @ api.js:29
registerUser @ api.js:53
handleRegister @ auth.js:232
(anonymous) @ auth.js:58
api.js:44 API请求错误: Error: 请求失败
    at BottleAPI.request (api.js:39:15)
    at async AuthManager.handleRegister (auth.js:232:24)
request @ api.js:44
await in request
registerUser @ api.js:53
handleRegister @ auth.js:232
(anonymous) @ auth.js:58
auth.js:257 注册错误: Error: 请求失败
    at BottleAPI.request (api.js:39:15)
    at async AuthManager.handleRegister (auth.js:232:24)