
// 漂流瓶功能模块
import { bottleAPI } from './api.js';
import { authManager, showToast, showLoading } from './auth.js';

class BottleManager {
  constructor() {
    // 当前显示的漂流瓶
    this.currentBottle = null;

    // 用户状态
    this.userState = null;

    // 当前视图模式
    this.currentView = 'pick'; // 'pick' 或 'write'

    // 绑定DOM元素
    this.bindElements();

    // 绑定事件
    this.bindEvents();

    // 初始化
    this.init();
  }

  // 绑定DOM元素
  bindElements() {
    // 容器
    this.pickBottleContainer = document.getElementById('pick-bottle');
    this.writeBottleContainer = document.getElementById('write-bottle');

    // 捡瓶子相关元素
    this.pickBtn = document.getElementById('pick-btn');
    this.bottleDisplay = document.getElementById('bottle-display');
    this.visualBottle = document.getElementById('visual-bottle');
    this.bottleContentView = document.getElementById('bottle-content-view');
    this.bottleMessage = document.getElementById('bottle-message');
    this.bottleAuthor = document.getElementById('bottle-author');
    this.bottleDate = document.getElementById('bottle-date');
    this.bottleLikes = document.getElementById('bottle-likes');
    this.bottleDislikes = document.getElementById('bottle-dislikes');
    this.bottleViews = document.getElementById('bottle-views');
    this.likeBtn = document.getElementById('like-btn');
    this.dislikeBtn = document.getElementById('dislike-btn');
    this.saveBtn = document.getElementById('save-btn');

    // 写瓶子相关元素
    this.messageInput = document.getElementById('message-input');
    this.charCount = document.getElementById('char-count');
    this.throwBtn = document.getElementById('throw-btn');

    // 切换按钮
    this.toggleBtn = document.getElementById('toggle-btn');
    this.devModeBtn = document.getElementById('dev-mode-btn');
  }

  // 绑定事件
  bindEvents() {
    // 捡瓶子事件
    this.pickBtn.addEventListener('click', () => this.pickBottle());
    this.visualBottle.addEventListener('click', () => this.openBottle());
    this.likeBtn.addEventListener('click', () => this.reactToBottle('like'));
    this.dislikeBtn.addEventListener('click', () => this.reactToBottle('dislike'));
    this.saveBtn.addEventListener('click', () => this.saveBottle());

    // 写瓶子事件
    this.messageInput.addEventListener('input', () => this.updateCharCount());
    this.throwBtn.addEventListener('click', () => this.throwBottle());

    // 切换视图事件
    this.toggleBtn.addEventListener('click', () => this.toggleView());
    this.devModeBtn.addEventListener('click', () => this.toggleDevMode());
  }

  // 初始化
  async init() {
    try {
      // 获取用户状态
      await this.loadUserState();

      // 更新UI
      this.updateUI();
    } catch (error) {
      console.error('初始化失败:', error);
      showToast('初始化失败，请刷新页面重试');
    }
  }

  // 加载用户状态
  async loadUserState() {
    try {
      const userId = authManager.getCurrentUserId();
      this.userState = await bottleAPI.getUserState(userId);

      // 更新当前视图
      if (this.userState.currentView) {
        this.currentView = this.userState.currentView;
      }

      // 更新开发者模式
      if (this.userState.devMode) {
        this.enableDevMode();
      }
    } catch (error) {
      console.error('加载用户状态失败:', error);
      // 设置默认状态
      this.userState = {
        hasPickedToday: false,
        hasThrownToday: false,
        lastPickDate: null,
        lastThrowDate: null,
        currentView: 'pick',
        devMode: false,
        hasSeenTutorial: false
      };
    }
  }

  // 更新UI
  updateUI() {
    // 更新视图模式
    if (this.currentView === 'pick') {
      this.pickBottleContainer.classList.remove('hidden');
      this.writeBottleContainer.classList.add('hidden');
      this.toggleBtn.textContent = '切换到写瓶子模式';
    } else {
      this.pickBottleContainer.classList.add('hidden');
      this.writeBottleContainer.classList.remove('hidden');
      this.toggleBtn.textContent = '切换到捡瓶子模式';
    }

    // 更新捡瓶子按钮状态
    if (this.userState.hasPickedToday) {
      this.pickBtn.disabled = true;
      this.pickBtn.textContent = '今天已经捡过漂流瓶了';
    } else {
      this.pickBtn.disabled = false;
      this.pickBtn.textContent = '捡起漂流瓶';
    }

    // 更新写瓶子按钮状态
    if (this.userState.hasThrownToday) {
      this.throwBtn.disabled = true;
      this.throwBtn.textContent = '今天已经投放过漂流瓶了';
    } else {
      this.throwBtn.disabled = false;
      this.throwBtn.textContent = '投入大海';
    }

    // 重置瓶子显示
    this.bottleDisplay.classList.add('hidden');
    this.bottleContentView.classList.add('hidden');
    this.visualBottle.classList.remove('hidden');
    this.currentBottle = null;
  }

  // 切换视图
  async toggleView() {
    this.currentView = this.currentView === 'pick' ? 'write' : 'pick';

    // 保存用户状态
    await this.updateUserState({ currentView: this.currentView });

    // 更新UI
    this.updateUI();
  }

  // 切换开发者模式
  async toggleDevMode() {
    this.userState.devMode = !this.userState.devMode;

    // 保存用户状态
    await this.updateUserState({ devMode: this.userState.devMode });

    // 更新UI
    if (this.userState.devMode) {
      this.enableDevMode();
    } else {
      this.disableDevMode();
    }
  }

  // 启用开发者模式
  enableDevMode() {
    this.devModeBtn.classList.add('active');
    this.devModeBtn.textContent = '关闭开发者模式';

    // 在开发者模式下，可以多次捡瓶子和写瓶子
    this.pickBtn.disabled = false;
    this.pickBtn.textContent = '捡起漂流瓶';
    this.throwBtn.disabled = false;
    this.throwBtn.textContent = '投入大海';
  }

  // 禁用开发者模式
  disableDevMode() {
    this.devModeBtn.classList.remove('active');
    this.devModeBtn.textContent = '开发者模式';

    // 恢复正常限制
    this.updateUI();
  }

  // 更新用户状态
  async updateUserState(stateUpdates) {
    try {
      const userId = authManager.getCurrentUserId();
      this.userState = {
        ...this.userState,
        ...stateUpdates
      };

      await bottleAPI.updateUserState(userId, stateUpdates);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      showToast('更新状态失败，请稍后再试');
    }
  }

  // 捡瓶子
  async pickBottle() {
    // 检查是否已经捡过
    if (this.userState.hasPickedToday && !this.userState.devMode) {
      showToast('今天已经捡过漂流瓶了，明天再来吧');
      return;
    }

    try {
      // 显示加载指示器
      showLoading(true);

      // 获取随机漂流瓶
      const userId = authManager.getCurrentUserId();
      const bottle = await bottleAPI.getRandomBottle(userId);

      if (bottle.id === null) {
        showToast(bottle.message || '没有更多漂流瓶了');
        return;
      }

      // 保存当前漂流瓶
      this.currentBottle = bottle;

      // 显示瓶子
      this.bottleDisplay.classList.remove('hidden');

      // 记录用户已捡起漂流瓶
      await bottleAPI.recordBottlePicked(userId);

      // 更新用户状态
      if (!this.userState.devMode) {
        await this.updateUserState({ hasPickedToday: true });
      }

      // 更新UI
      this.updateUI();

      showToast('捡起了一个漂流瓶，点击打开看看里面有什么');
    } catch (error) {
      console.error('捡瓶子失败:', error);
      showToast('捡瓶子失败，请稍后再试');
    } finally {
      // 隐藏加载指示器
      showLoading(false);
    }
  }

  // 打开瓶子
  openBottle() {
    if (!this.currentBottle) {
      showToast('没有可打开的漂流瓶');
      return;
    }

    // 更新瓶子内容
    this.bottleMessage.textContent = this.currentBottle.message;
    this.bottleAuthor.textContent = `作者: ${this.currentBottle.author || '匿名'}`;
    this.bottleDate.textContent = `日期: ${this.currentBottle.date}`;
    this.bottleLikes.textContent = this.currentBottle.likes;
    this.bottleDislikes.textContent = this.currentBottle.dislikes;
    this.bottleViews.textContent = this.currentBottle.views;

    // 更新反应按钮状态
    if (this.currentBottle.userReaction === 'like') {
      this.likeBtn.classList.add('active');
      this.dislikeBtn.classList.remove('active');
    } else if (this.currentBottle.userReaction === 'dislike') {
      this.likeBtn.classList.remove('active');
      this.dislikeBtn.classList.add('active');
    } else {
      this.likeBtn.classList.remove('active');
      this.dislikeBtn.classList.remove('active');
    }

    // 切换显示
    this.visualBottle.classList.add('hidden');
    this.bottleContentView.classList.remove('hidden');
  }

  // 对漂流瓶做出反应
  async reactToBottle(reactionType) {
    if (!this.currentBottle) {
      showToast('没有可操作的漂流瓶');
      return;
    }

    // 检查是否已登录
    if (!authManager.isLoggedIn()) {
      showToast('请先登录后再进行操作');
      return;
    }

    try {
      // 显示加载指示器
      showLoading(true);

      // 调用API进行反应
      const userId = authManager.getCurrentUserId();
      const response = await bottleAPI.reactToBottle(
        userId,
        this.currentBottle.id,
        reactionType
      );

      // 更新瓶子信息
      this.currentBottle.likes = response.likes;
      this.currentBottle.dislikes = response.dislikes;
      this.currentBottle.userReaction = response.userReaction;

      // 更新UI
      this.bottleLikes.textContent = this.currentBottle.likes;
      this.bottleDislikes.textContent = this.currentBottle.dislikes;

      if (response.userReaction === 'like') {
        this.likeBtn.classList.add('active');
        this.dislikeBtn.classList.remove('active');
        showToast('投了一个扇贝');
      } else if (response.userReaction === 'dislike') {
        this.likeBtn.classList.remove('active');
        this.dislikeBtn.classList.add('active');
        showToast('投了一个鱼骨头');
      } else {
        this.likeBtn.classList.remove('active');
        this.dislikeBtn.classList.remove('active');
        showToast('取消反应');
      }
    } catch (error) {
      console.error('反应操作失败:', error);
      showToast('操作失败，请稍后再试');
    } finally {
      // 隐藏加载指示器
      showLoading(false);
    }
  }

  // 保存漂流瓶
  async saveBottle() {
    if (!this.currentBottle) {
      showToast('没有可保存的漂流瓶');
      return;
    }

    try {
      // 显示加载指示器
      showLoading(true);

      // 调用API保存漂流瓶
      const userId = authManager.getCurrentUserId();
      await bottleAPI.saveBottle(userId, this.currentBottle.id);

      showToast('漂流瓶已保存到收藏');
    } catch (error) {
      console.error('保存漂流瓶失败:', error);
      showToast('保存失败，请稍后再试');
    } finally {
      // 隐藏加载指示器
      showLoading(false);
    }
  }

  // 更新字符计数
  updateCharCount() {
    const length = this.messageInput.value.length;
    this.charCount.textContent = length;

    // 如果超过限制，显示红色
    if (length > 500) {
      this.charCount.style.color = 'red';
    } else {
      this.charCount.style.color = '';
    }
  }

  // 投放漂流瓶
  async throwBottle() {
    const message = this.messageInput.value.trim();

    // 验证输入
    if (!message) {
      showToast('请输入漂流瓶内容');
      return;
    }

    if (message.length > 500) {
      showToast('漂流瓶内容不能超过500个字符');
      return;
    }

    // 检查是否已经投放过
    if (this.userState.hasThrownToday && !this.userState.devMode) {
      showToast('今天已经投放过漂流瓶了，明天再来吧');
      return;
    }

    try {
      // 显示加载指示器
      showLoading(true);

      // 获取作者名
      const authorName = authManager.isLoggedIn() ? authManager.getCurrentUser().username : '匿名';

      // 调用API创建漂流瓶
      const userId = authManager.getCurrentUserId();
      const bottle = await bottleAPI.createBottle(userId, message, authorName);

      // 清空输入
      this.messageInput.value = '';
      this.updateCharCount();

      // 更新用户状态
      if (!this.userState.devMode) {
        await this.updateUserState({ hasThrownToday: true });
      }

      // 更新UI
      this.updateUI();

      showToast('漂流瓶已成功投入大海');
    } catch (error) {
      console.error('投放漂流瓶失败:', error);
      showToast('投放失败，请稍后再试');
    } finally {
      // 隐藏加载指示器
      showLoading(false);
    }
  }
}

// 导出漂流瓶管理器实例
export const bottleManager = new BottleManager();
