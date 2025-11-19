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
        this.userState = StorageService.getUserState();
        this.viewedBottles = this.userState.viewedBottles || [];
    }

    /**
     * 初始化应用
     */
    async init() {
        // 加载漂流瓶数据
        await this.bottleService.loadBottles();

        // 设置事件监听器
        this.setupEventListeners();

        // 更新UI
        this.uiController.updateUI(this.userState);
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
            openBottle: this.openBottle.bind(this)
        });
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
    pickBottleFromSea() {
        if (!this.userState.devMode && this.userState.hasPickedToday) {
            this.uiController.showToast('今天已经捡过漂流瓶了，明天再来吧！', 'error');
            return;
        }

        // 获取一个未看过的漂流瓶
        const bottle = this.bottleService.getUnseenBottle(this.viewedBottles);

        if (!bottle) {
            this.uiController.showToast('大海中没有漂流瓶了，明天再来吧！', 'error');
            return;
        }

        // 将漂流瓶ID添加到已看列表
        this.viewedBottles.push(bottle.id);

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
            liked: false,
            disliked: false
        };

        // 更新UI
        this.uiController.updateUI(this.userState);
        this.saveUserState();

        // 显示捡到的瓶子
        this.uiController.showPickedBottle(bottle);

        this.uiController.showToast('你捡到了一个漂流瓶！', 'success');
    }

    /**
     * 投漂流瓶
     */
    throwBottleToSea() {
        if (!this.userState.devMode && this.userState.hasThrownToday) {
            this.uiController.showToast('今天已经投过漂流瓶了，明天再来吧！', 'error');
            return;
        }

        const message = this.uiController.getMessageInput();
        if (message === '') {
            this.uiController.showToast('请写下你想说的话', 'error');
            return;
        }

        // 创建新的漂流瓶
        this.bottleService.createBottle(message);

        // 更新状态
        this.userState.hasThrownToday = true;

        // 清空输入框
        this.uiController.clearMessageInput();

        // 更新UI
        this.uiController.updateUI(this.userState);
        this.saveUserState();

        this.uiController.showToast('你的漂流瓶已投入大海！', 'success');
    }

    /**
     * 喜欢瓶子（投扇贝）
     */
    likeBottle() {
        if (!this.userState.currentBottle || this.userState.currentBottle.liked) return;

        // 更新瓶子状态
        this.userState.currentBottle.liked = true;
        this.userState.currentBottle.disliked = false;

        // 更新UI中的点赞数
        this.uiController.updateLikesCount();

        // 显示提示消息
        this.uiController.showToast('你投了一个扇贝，这个瓶子会被更多人看到！', 'success');

        // 禁用按钮
        this.uiController.disableLikeButtons();
    }

    /**
     * 不喜欢瓶子（投鱼骨头）
     */
    dislikeBottle() {
        if (!this.userState.currentBottle || this.userState.currentBottle.disliked) return;

        // 更新用户状态
        this.userState.currentBottle.disliked = true;
        this.userState.currentBottle.liked = false;

        // 更新UI中的点踩数
        this.uiController.updateDislikesCount();

        // 显示提示信息
        this.uiController.showToast('你投了一个鱼骨头，这个瓶子会被减少曝光', 'success');

        // 禁用按钮
        this.uiController.disableLikeButtons();
    }

    /**
     * 保存当前漂流瓶
     */
    saveCurrentBottle() {
        if (!this.userState.currentBottle) {
            this.uiController.showToast('没有可保存的漂流瓶', 'error');
            return;
        }

        // 检查是否已经保存过这个漂流瓶
        const savedBottles = StorageService.getSavedBottles();
        const isSaved = savedBottles.some(bottle => bottle.id === this.userState.currentBottle.id);

        if (isSaved) {
            this.uiController.showToast('这个漂流瓶已经保存过了', 'error');
            return;
        }

        // 弹出输入框，让用户输入标注
        const annotation = this.uiController.promptForAnnotation('请为这个漂流瓶添加一个标注（最多10个字）：');

        if (annotation === null) {
            // 用户点击了取消
            return;
        }

        // 保存漂流瓶
        const success = this.bottleService.saveBottle(this.userState.currentBottle, annotation);

        if (success) {
            // 更新UI
            this.uiController.updateUI(this.userState);
            this.uiController.showToast('漂流瓶已保存到收藏！', 'success');
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
        this.uiController.openBottle();
    }

    /**
     * 保存用户状态
     */
    saveUserState() {
        this.userState.viewedBottles = this.viewedBottles;
        StorageService.setUserState(this.userState);
    }
}

export { AppController };
