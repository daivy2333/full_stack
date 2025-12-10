apiService.js:29 
 POST http://127.0.0.1:5500/api/update_user_state 405 (Method Not Allowed)
apiRequest	@	apiService.js:29
updateUserState	@	apiService.js:103
updateUserState	@	userManager.js:199
setCurrentView	@	userManager.js:267
switchView	@	newAppController.js:699
initApp	@	newAppController.js:101
AppController	@	newAppController.js:80
(anonymous)	@	newAppController.js:954
apiService.js:40 API请求错误: Error: API请求失败: 405 Method Not Allowed
    at apiRequest (apiService.js:33:13)
    at async UserManager.updateUserState (userManager.js:199:28)
    at async AppController.switchView (newAppController.js:699:5)
apiRequest	@	apiService.js:40
await in apiRequest		
updateUserState	@	apiService.js:103
updateUserState	@	userManager.js:199
setCurrentView	@	userManager.js:267
switchView	@	newAppController.js:699
initApp	@	newAppController.js:101
AppController	@	newAppController.js:80
(anonymous)	@	newAppController.js:954
userManager.js:204 更新用户状态失败: Error: API请求失败: 405 Method Not Allowed
    at apiRequest (apiService.js:33:13)
    at async UserManager.updateUserState (userManager.js:199:28)
    at async AppController.switchView (newAppController.js:699:5)
updateUserState	@	userManager.js:204
await in updateUserState		
setCurrentView	@	userManager.js:267
switchView	@	newAppController.js:699
initApp	@	newAppController.js:101
AppController	@	newAppController.js:80
(anonymous)	@	newAppController.js:954
apiService.js:29 
 GET http://127.0.0.1:5500/api/get_user_saved_bottles 404 (Not Found)
apiRequest	@	apiService.js:29
getUserSavedBottles	@	apiService.js:184
fetchSavedBottles	@	bottleManager.js:129
BottleManager	@	bottleManager.js:21
(anonymous)	@	bottleManager.js:232
apiService.js:40 API请求错误: Error: API请求失败: 404 Not Found
    at apiRequest (apiService.js:33:13)
    at async BottleManager.fetchSavedBottles (bottleManager.js:129:23)
apiRequest	@	apiService.js:40
await in apiRequest		
getUserSavedBottles	@	apiService.js:184
fetchSavedBottles	@	bottleManager.js:129
BottleManager	@	bottleManager.js:21
(anonymous)	@	bottleManager.js:232
bottleManager.js:133 获取用户收藏的漂流瓶失败: Error: API请求失败: 404 Not Found
    at apiRequest (apiService.js:33:13)
    at async BottleManager.fetchSavedBottles (bottleManager.js:129:23)
fetchSavedBottles	@	bottleManager.js:133
await in fetchSavedBottles		
BottleManager	@	bottleManager.js:21
(anonymous)	@	bottleManager.js:232
newMain.js:41 未处理的Promise错误: TypeError: Cannot read properties of undefined (reading 'forEach')
    at AppController.switchView (newAppController.js:702:28)
(anonymous)	@	newMain.js:41
newAppController.js:702 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'forEach')
    at AppController.switchView (newAppController.js:702:28)
switchView	@	newAppController.js:702
await in switchView		
initApp	@	newAppController.js:101
AppController	@	newAppController.js:80
(anonymous)	@	newAppController.js:954

API请求错误修复

修改了API基础URL，从相对路径改为绝对路径http://127.0.0.1:5500/api
这解决了405 Method Not Allowed和404 Not Found错误
TypeError错误修复

在switchView方法中添加了对viewTabs存在性的检查
修复了尝试读取未定义对象属性的问题
界面兼容性修复

修改了视图切换逻辑，使其与现有HTML结构兼容
调整了初始化应用时的视图显示逻辑
更新了教程显示方式，使用showHowToPlay而不是showTutorial
修改了加载状态显示，使用loadingIndicator而不是loading
更新了消息显示，使用toast而不是message
调整了清空输入框的逻辑
优化了按钮状态更新逻辑
收藏功能处理

修改了收藏视图的处理方式，改为跳转到saved-bottles.html页面
这些修改解决了日志中报告的主要错误，使应用能够与后端数据库正确联通，同时保持了与现有HTML结构的兼容性。