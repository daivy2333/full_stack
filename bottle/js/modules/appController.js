/**
 * 应用控制器模块
 * 负责协调各个模块，处理应用的核心业务逻辑
 */

import { BottleService } from './bottleService.js';
import { StorageService } from './storageService.js';
import { UIController } from './uiController.js';

/**
 * 应用控制器类
 */
class AppController {
    constructor() {
        this.bottleService = new BottleService();
        this.uiController = new UIController();
        this.userState = null;
        this.viewedBottles = [];
        this.currentUser = null;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            // 检查用户是否已登录
            const token = StorageService.getToken();
            if (token) {
                this.currentUser = StorageService.getUserInfo();
                // 获取用户状态
                this.userState = await StorageService.getUserState();
            } else {
                // 如果用户未登录，使用默认状态
                this.userState = {
                    hasPickedToday: false,
                    hasThrownToday: false,
                    lastPickDate: null,
                    lastThrowDate: null,
                    currentView: 'pick',
                    devMode: false,
                    hasSeenTutorial: false,
                    currentBottle: null,
                    viewedBottles: []
                };
            }

            // 设置事件监听器
            this.setupEventListeners();

            // 更新UI
            this.uiController.updateUI(this.userState, this.currentUser);
        } catch (error) {
            console.error('初始化应用失败:', error);
            // 显示错误提示
            this.uiController.showToast('初始化应用失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        this.uiController.initEventListeners({
            pickBottleFromSea: this.pickBottleFromSea.bind(this),
            throwBottleToSea: this.throwBottleToSea.bind(this),
            toggleView: this.toggleView.bind(this),
            likeBottle: this.likeBottle.bind(this),
            dislikeBottle: this.dislikeBottle.bind(this),
            saveCurrentBottle: this.saveCurrentBottle.bind(this),
            updateCharCount: this.updateCharCount.bind(this),
            toggleDevMode: this.toggleDevMode.bind(this),
            handleTitleClick: this.handleTitleClick.bind(this),
            showTutorialBottle: this.showTutorialBottle.bind(this),
            openBottle: this.openBottle.bind(this),
            // 添加认证相关事件
            showLoginModal: this.showLoginModal.bind(this),
            showRegisterModal: this.showRegisterModal.bind(this),
            login: this.login.bind(this),
            register: this.register.bind(this),
            logout: this.logout.bind(this)
        });
    }

    /**
     * 显示登录模态框
     */
    showLoginModal() {
        this.uiController.showLoginModal();
    }

    /**
     * 显示注册模态框
     */
    showRegisterModal() {
        this.uiController.showRegisterModal();
    }

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     */
    async login(username, password) {
        try {
            const data = await StorageService.login(username, password);
            this.currentUser = data.user;

            // 获取用户状态
            this.userState = await StorageService.getUserState();

            // 更新UI
            this.uiController.updateUI(this.userState, this.currentUser);
            this.uiController.hideAuthModals();
            this.uiController.showToast('登录成功', 'success');
        } catch (error) {
            console.error('登录失败:', error);
            this.uiController.showToast(error.message || '登录失败', 'error');
        }
    }

    /**
     * 用户注册
     * @param {string} username - 用户名
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     */
    async register(username, email, password) {
        try {
            const data = await StorageService.register(username, email, password);
            this.currentUser = data.user;

            // 获取用户状态
            this.userState = await StorageService.getUserState();

            // 更新UI
            this.uiController.updateUI(this.userState, this.currentUser);
            this.uiController.hideAuthModals();
            this.uiController.showToast('注册成功', 'success');
        } catch (error) {
            console.error('注册失败:', error);
            this.uiController.showToast(error.message || '注册失败', 'error');
        }
    }

    /**
     * 用户登出
     */
    logout() {
        StorageService.logout();
        this.currentUser = null;

        // 重置用户状态
        this.userState = {
            hasPickedToday: false,
            hasThrownToday: false,
            lastPickDate: null,
            lastThrowDate: null,
            currentView: 'pick',
            devMode: false,
            hasSeenTutorial: false,
            currentBottle: null,
            viewedBottles: []
        };

        // 更新UI
        this.uiController.updateUI(this.userState, this.currentUser);
        this.uiController.showToast('已退出登录', 'info');
    }

    /**
     * 切换视图
     */
    toggleView() {
        this.userState.currentView = this.userState.currentView === 'pick' ? 'write' : 'pick';
        this.uiController.updateUI(this.userState);
        this.saveUserState();
    }

    /**
     * 更新字符计数
     */
    updateCharCount() {
        this.uiController.updateCharCount();
        const count = this.uiController.elements.messageInput.value.length;
        this.uiController.elements.throwBtn.disabled = this.userState.hasThrownToday || count === 0;
    }

    /**
     * 捡漂流瓶
     */
    async pickBottleFromSea() {
        try {
            if (!this.userState.devMode && this.userState.hasPickedToday) {
                this.uiController.showToast('今天已经捡过漂流瓶了，明天再来吧！', 'error');
                return;
            }

            // 显示加载中状态
            this.uiController.showLoadingState();

            // 从API获取一个随机漂流瓶
            const bottle = await this.bottleService.getRandomBottle();

            // 更新状态
            this.userState.hasPickedToday = true;
            this.userState.currentBottle = {
                id: bottle.id,
                message: bottle.message,
                author: bottle.author,
                date: bottle.date,
                likes: bottle.likes,
                dislikes: bottle.dislikes,
                views: bottle.views,
                liked: bottle.userReaction === 'like',
                disliked: bottle.userReaction === 'dislike',
                isOpened: false // 标记瓶子是否已打开
            };

            // 更新UI
            this.uiController.updateUI(this.userState, this.currentUser);
            await this.saveUserState();

            // 显示捡到的瓶子
            this.uiController.showPickedBottle(bottle);

            // 在非开发者模式下，直接打开瓶子
            if (!this.userState.devMode) {
                setTimeout(() => {
                    this.openBottle();
                    this.userState.currentBottle.isOpened = true;
                    this.saveUserState();
                }, 1500); // 延迟1.5秒后自动打开，让用户看到瓶子动画
            }

            this.uiController.showToast('你捡到了一个漂流瓶！', 'success');
        } catch (error) {
            console.error('捡漂流瓶失败:', error);
            this.uiController.showToast('捡漂流瓶失败，请重试', 'error');
        } finally {
            // 隐藏加载中状态
            this.uiController.hideLoadingState();
        }
    }

    /**
     * 投漂流瓶
     */
    async throwBottleToSea() {
        try {
            if (!this.userState.devMode && this.userState.hasThrownToday) {
                this.uiController.showToast('今天已经投过漂流瓶了，明天再来吧！', 'error');
                return;
            }

            const message = this.uiController.getMessageInput();
            if (message === '') {
                this.uiController.showToast('请写下你想说的话', 'error');
                return;
            }

            // 显示加载中状态
            this.uiController.showLoadingState();

            // 创建新的漂流瓶
            const authorName = this.currentUser ? this.currentUser.username : "匿名用户";
            await this.bottleService.createBottle(message, authorName);

            // 更新状态
            this.userState.hasThrownToday = true;
            await this.saveUserState();

            // 清空输入框
            this.uiController.clearMessageInput();

            // 更新UI
            this.uiController.updateUI(this.userState, this.currentUser);

            this.uiController.showToast('你的漂流瓶已投入大海！', 'success');
        } catch (error) {
            console.error('投漂流瓶失败:', error);
            this.uiController.showToast('投漂流瓶失败，请重试', 'error');
        } finally {
            // 隐藏加载中状态
            this.uiController.hideLoadingState();
        }
    }

    /**
     * 喜欢瓶子（投扇贝）
     */
    async likeBottle() {
        try {
            if (!this.userState.currentBottle || this.userState.currentBottle.liked) return;

            // 显示加载中状态
            this.uiController.showLoadingState();

            // 调用API进行点赞
            const result = await this.bottleService.reactToBottle(this.userState.currentBottle.id, 'like');

            // 更新瓶子状态
            this.userState.currentBottle.liked = true;
            this.userState.currentBottle.disliked = false;
            this.userState.currentBottle.likes = result.likes;
            this.userState.currentBottle.dislikes = result.dislikes;

            // 更新UI中的点赞数
            this.uiController.updateLikesCount();

            // 显示提示消息
            this.uiController.showToast('你投了一个扇贝，这个瓶子会被更多人看到！', 'success');

            // 禁用按钮
            this.uiController.disableLikeButtons();
        } catch (error) {
            console.error('点赞失败:', error);
            this.uiController.showToast('点赞失败，请重试', 'error');
        } finally {
            // 隐藏加载中状态
            this.uiController.hideLoadingState();
        }
    }

    /**
     * 不喜欢瓶子（投鱼骨头）
     */
    async dislikeBottle() {
        try {
            if (!this.userState.currentBottle || this.userState.currentBottle.disliked) return;

            // 显示加载中状态
            this.uiController.showLoadingState();

            // 调用API进行点踩
            const result = await this.bottleService.reactToBottle(this.userState.currentBottle.id, 'dislike');

            // 更新用户状态
            this.userState.currentBottle.disliked = true;
            this.userState.currentBottle.liked = false;
            this.userState.currentBottle.likes = result.likes;
            this.userState.currentBottle.dislikes = result.dislikes;

            // 更新UI中的点踩数
            this.uiController.updateDislikesCount();

            // 显示提示信息
            this.uiController.showToast('你投了一个鱼骨头，这个瓶子会被减少曝光', 'success');

            // 禁用按钮
            this.uiController.disableLikeButtons();
        } catch (error) {
            console.error('点踩失败:', error);
            this.uiController.showToast('点踩失败，请重试', 'error');
        } finally {
            // 隐藏加载中状态
            this.uiController.hideLoadingState();
        }
    }

    /**
     * 保存当前漂流瓶
     */
    async saveCurrentBottle() {
        try {
            if (!this.userState.currentBottle) {
                this.uiController.showToast('没有可保存的漂流瓶', 'error');
                return;
            }

            // 检查用户是否已登录
            if (!this.currentUser) {
                this.uiController.showToast('请先登录后再保存漂流瓶', 'error');
                this.showLoginModal();
                return;
            }

            // 弹出输入框，让用户输入标注
            const annotation = this.uiController.promptForAnnotation('请为这个漂流瓶添加一个标注（最多10个字）：');

            if (annotation === null) {
                // 用户点击了取消
                return;
            }

            // 显示加载中状态
            this.uiController.showLoadingState();

            // 保存漂流瓶
            const success = await this.bottleService.saveBottle(this.userState.currentBottle, annotation);

            if (success) {
                // 更新UI
                this.uiController.updateUI(this.userState, this.currentUser);
                this.uiController.showToast('漂流瓶已保存到收藏！', 'success');
            } else {
                this.uiController.showToast('保存漂流瓶失败', 'error');
            }
        } catch (error) {
            console.error('保存漂流瓶失败:', error);
            this.uiController.showToast('保存漂流瓶失败，请重试', 'error');
        } finally {
            // 隐藏加载中状态
            this.uiController.hideLoadingState();
        }
    }

    /**
     * 处理标题点击事件
     */
    handleTitleClick() {
        this.uiController.handleTitleClick(() => {
            // 点击5次后的回调函数
        });
    }

    /**
     * 开发者模式
     */
    toggleDevMode() {
        // 切换开发者模式状态
        this.userState.devMode = !this.userState.devMode;

        if (this.userState.devMode) {
            // 开启开发者模式时，重置所有状态
            this.userState.hasPickedToday = false;
            this.userState.hasThrownToday = false;
            this.userState.currentBottle = null;

            // 显示提示
            this.uiController.showToast('开发者模式已激活，所有限制已重置', 'success');
        } else {
            // 关闭开发者模式时，重置状态
            this.userState.hasPickedToday = false;
            this.userState.hasThrownToday = false;
            this.userState.currentBottle = null;

            // 显示提示
            this.uiController.showToast('开发者模式已关闭，恢复正常限制', 'info');
        }

        // 更新UI
        this.uiController.updateUI(this.userState);
        this.saveUserState();
    }

    /**
     * 显示玩法说明漂流瓶
     */
    showTutorialBottle() {
        // 创建特殊的玩法说明漂流瓶
        const tutorialBottle = this.bottleService.createTutorialBottle();

        // 确保当前视图是捡瓶子模式
        if (this.userState.currentView !== 'pick') {
            this.userState.currentView = 'pick';
            this.uiController.updateUI(this.userState);
        }

        // 更新状态
        this.userState.currentBottle = {
            id: tutorialBottle.id,
            message: tutorialBottle.message,
            author: tutorialBottle.author,
            date: tutorialBottle.date,
            likes: tutorialBottle.likes,
            dislikes: tutorialBottle.dislikes,
            views: tutorialBottle.views,
            liked: false,
            disliked: false
        };

        // 更新UI
        this.uiController.updateUI(this.userState);

        // 显示玩法说明瓶子
        // 直接显示内容，不需要视觉瓶子
        this.uiController.elements.bottleWrapper.classList.remove('hidden');
        this.uiController.elements.visualBottle.classList.add('hidden');
        this.uiController.elements.bottleContentView.classList.remove('hidden');
        
        this.uiController.renderBottleContent(tutorialBottle);

        // 禁用点赞和点踩按钮（因为是系统瓶子）
        this.uiController.elements.likeBtn.disabled = true;
        this.uiController.elements.dislikeBtn.disabled = true;

        this.uiController.showToast('你捡到了一个特殊的漂流瓶！', 'success');
    }

    /**
     * 打开瓶子
     */
    openBottle() {
        this.uiController.openBottle(this.userState);
        // 标记瓶子已打开
        if (this.userState.currentBottle) {
            this.userState.currentBottle.isOpened = true;
            this.saveUserState();
        }
    }

    /**
     * 保存用户状态
     */
    async saveUserState() {
        try {
            this.userState.viewedBottles = this.viewedBottles;
            await StorageService.setUserState(this.userState);
        } catch (error) {
            console.error('保存用户状态失败:', error);
            // 如果API请求失败，回退到本地存储
            localStorage.setItem('bottleUserState', JSON.stringify(this.userState));
        }
    }
}

export { AppController };
