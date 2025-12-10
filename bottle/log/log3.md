storageService.js:88 
 GET http://localhost:3000/api/bottles/random 404 (Not Found)
storageService.js:89 收到响应，状态码: 404
storageService.js:92 响应数据: 
{error: '未找到请求的资源'}
storageService.js:97 API请求失败: 未找到请求的资源
storageService.js:103 API请求错误: Error: 未找到请求的资源
    at StorageService.apiRequest (storageService.js:98:23)
    at async BottleService.getRandomBottle (bottleService.js:52:26)
    at async AppController.pickBottleFromSea (appController.js:261:28)
storageService.js:104 请求URL: http://localhost:3000/api/bottles/random
storageService.js:105 请求选项: 
{headers: {…}}
bottleService.js:56 获取随机漂流瓶失败: Error: 未找到请求的资源
    at StorageService.apiRequest (storageService.js:98:23)
    at async BottleService.getRandomBottle (bottleService.js:52:26)
    at async AppController.pickBottleFromSea (appController.js:261:28)
bottleService.js:57 错误详情: 未找到请求的资源
bottleService.js:58 API基础URL: http://localhost:3000/api