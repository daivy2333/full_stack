ailed to load resource: the server responded with a status of 401 (Unauthorized)
storageService.js:89 收到响应，状态码: 401
storageService.js:92 响应数据: Object
storageService.js:97 API请求失败: 访问令牌缺失
apiRequest @ storageService.js:97
storageService.js:103 API请求错误: Error: 访问令牌缺失
    at StorageService.apiRequest (storageService.js:98:23)
    at async BottleService.reactToBottle (bottleService.js:183:26)
    at async AppController.dislikeBottle (appController.js:348:28)
apiRequest @ storageService.js:103
storageService.js:104 请求URL: http://localhost:3000/api/bottles/1/react
apiRequest @ storageService.js:104
storageService.js:105 请求选项: Object
apiRequest @ storageService.js:105
bottleService.js:191 漂流瓶反应失败: Error: 访问令牌缺失
    at StorageService.apiRequest (storageService.js:98:23)
    at async BottleService.reactToBottle (bottleService.js:183:26)
    at async AppController.dislikeBottle (appController.js:348:28)
reactToBottle @ bottleService.js:191
appController.js:365 点踩失败: Error: 访问令牌缺失
    at StorageService.apiRequest (storageService.js:98:23)
    at async BottleService.reactToBottle (bottleService.js:183:26)
    at async AppController.dislikeBottle (appController.js:348:28)
dislikeBottle @ appController.js:365
appController.js:412 保存漂流瓶失败: TypeError: this.uiController.showLoginModal is not a function
    at AppController.showLoginModal (appController.js:89:27)
    at AppController.saveCurrentBottle (appController.js:386:22)
saveCurrentBottle @ appController.js:412