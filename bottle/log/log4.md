Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
    at Oi (background.js:2:9888)
storageService.js:63 发起API请求: GET http://localhost:3000/api/user/state
storageService.js:75 使用认证令牌发起请求
storageService.js:87 发送请求到服务器...
storageService.js:89 收到响应，状态码: 200
storageService.js:92 响应数据: Object
uiController.js:105 开发者模式已激活
main.js:22 漂流瓶应用初始化成功
Unchecked runtime.lastError: Cannot create item with duplicate id fulltextTranslate
Unchecked runtime.lastError: Cannot create item with duplicate id addToReadLater
Unchecked runtime.lastError: Cannot create item with duplicate id fulltextTranslate
appController.js:247 开始捡漂流瓶流程...
appController.js:256 显示加载中状态
appController.js:260 从API获取随机漂流瓶...
bottleService.js:51 正在获取随机漂流瓶...
storageService.js:63 发起API请求: GET http://localhost:3000/api/bottles/random
storageService.js:75 使用认证令牌发起请求
storageService.js:87 发送请求到服务器...
storageService.js:88  GET http://localhost:3000/api/bottles/random 404 (Not Found)
apiRequest @ storageService.js:88
getRandomBottle @ bottleService.js:52
pickBottleFromSea @ appController.js:261
storageService.js:89 收到响应，状态码: 404
storageService.js:92 响应数据: {error: '没有可用的漂流瓶'}
storageService.js:97 API请求失败: 没有可用的漂流瓶
apiRequest @ storageService.js:97
await in apiRequest
getRandomBottle @ bottleService.js:52
pickBottleFromSea @ appController.js:261
storageService.js:103 API请求错误: Error: 没有可用的漂流瓶
    at StorageService.apiRequest (storageService.js:98:23)
    at async BottleService.getRandomBottle (bottleService.js:52:26)
    at async AppController.pickBottleFromSea (appController.js:261:28)
apiRequest @ storageService.js:103
await in apiRequest
getRandomBottle @ bottleService.js:52
pickBottleFromSea @ appController.js:261
storageService.js:104 请求URL: http://localhost:3000/api/bottles/random
apiRequest @ storageService.js:104
await in apiRequest
getRandomBottle @ bottleService.js:52
pickBottleFromSea @ appController.js:261
storageService.js:105 请求选项: {headers: {…}}
apiRequest @ storageService.js:105
await in apiRequest
getRandomBottle @ bottleService.js:52
pickBottleFromSea @ appController.js:261
bottleService.js:56 获取随机漂流瓶失败: Error: 没有可用的漂流瓶
    at StorageService.apiRequest (storageService.js:98:23)
    at async BottleService.getRandomBottle (bottleService.js:52:26)
    at async AppController.pickBottleFromSea (appController.js:261:28)
getRandomBottle @ bottleService.js:56
await in getRandomBottle
pickBottleFromSea @ appController.js:261
bottleService.js:57 错误详情: 没有可用的漂流瓶
getRandomBottle @ bottleService.js:57
await in getRandomBottle
pickBottleFromSea @ appController.js:261
bottleService.js:58 API基础URL: http://localhost:3000/api
getRandomBottle @ bottleService.js:58
await in getRandomBottle
pickBottleFromSea @ appController.js:261
appController.js:262 获取到的漂流瓶: 