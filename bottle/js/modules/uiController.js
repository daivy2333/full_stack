/**
 * UI控制器模块
 * 负责处理所有UI相关的操作，包括DOM操作、事件监听等
 */

/**
 * UI控制器类
 */
class UIController {
    constructor() {
        // DOM元素
        this.elements = {
            pickBtn: document.getElementById('pick-btn'),
            throwBtn: document.getElementById('throw-btn'),
            toggleBtn: document.getElementById('toggle-btn'),
            likeBtn: document.getElementById('like-btn'),
            dislikeBtn: document.getElementById('dislike-btn'),
            saveBtn: document.getElementById('save-btn'),
            bottleWrapper: document.getElementById('bottle-display'),
            visualBottle: document.getElementById('visual-bottle'),
            bottleContentView: document.getElementById('bottle-content-view'),
            bottleMessage: document.getElementById('bottle-message'),
            bottleAuthor: document.getElementById('bottle-author'),
            bottleDate: document.getElementById('bottle-date'),
            bottleLikes: document.getElementById('bottle-likes'),
            bottleDislikes: document.getElementById('bottle-dislikes'),
            bottleViews: document.getElementById('bottle-views'),
            messageInput: document.getElementById('message-input'),
            charCount: document.getElementById('char-count'),
            pickBottle: document.getElementById('pick-bottle'),
            writeBottle: document.getElementById('write-bottle'),
            pickStatus: document.getElementById('pick-status'),
            throwStatus: document.getElementById('throw-status'),
            toast: document.getElementById('toast'),
            devModeBtn: document.getElementById('dev-mode-btn'),
            headerTitle: document.querySelector('header h1'),
            howToPlayBtn: document.getElementById('how-to-play-btn')
        };

        // 开发者模式相关变量
        this.titleClickCount = 0;
        this.titleClickTimer = null;
    }

    /**
     * 初始化事件监听器
     * @param {Object} handlers - 事件处理函数对象
     */
    initEventListeners(handlers) {
        const {
            pickBottleFromSea,
            throwBottleToSea,
            toggleView,
            likeBottle,
            dislikeBottle,
            saveCurrentBottle,
            updateCharCount,
            toggleDevMode,
            handleTitleClick,
            showTutorialBottle,
            openBottle
        } = handlers;

        // 设置事件监听器
        this.elements.pickBtn.addEventListener('click', pickBottleFromSea);
        this.elements.throwBtn.addEventListener('click', throwBottleToSea);
        this.elements.toggleBtn.addEventListener('click', toggleView);
        this.elements.likeBtn.addEventListener('click', likeBottle);
        this.elements.dislikeBtn.addEventListener('click', dislikeBottle);
        this.elements.saveBtn.addEventListener('click', saveCurrentBottle);
        this.elements.messageInput.addEventListener('input', updateCharCount);
        this.elements.devModeBtn.addEventListener('click', toggleDevMode);
        this.elements.headerTitle.addEventListener('click', handleTitleClick);
        this.elements.howToPlayBtn.addEventListener('click', showTutorialBottle);

        // 绑定点击"视觉瓶子"的事件，点击后打开信件
        if (this.elements.visualBottle) {
            this.elements.visualBottle.addEventListener('click', () => openBottle());
        }

        // 初始隐藏开发者模式按钮
        this.elements.devModeBtn.style.display = 'none';
    }

    /**
     * 更新UI
     * @param {Object} userState - 用户状态
     */
    updateUI(userState) {
        // 更新状态显示
        if (userState.devMode) {
            console.log('开发者模式已激活');
        }

        // 更新按钮状态
        this.elements.pickBtn.disabled = !userState.devMode && userState.hasPickedToday;
        this.elements.throwBtn.disabled = !userState.devMode && (userState.hasThrownToday || this.elements.messageInput.value.trim() === '');

        // 更新视图
        if (userState.currentView === 'pick') {
            this.elements.pickBottle.classList.remove('hidden');
            this.elements.writeBottle.classList.add('hidden');
            this.elements.toggleBtn.textContent = '切换到写瓶子模式';
        } else {
            this.elements.pickBottle.classList.add('hidden');
            this.elements.writeBottle.classList.remove('hidden');
            this.elements.toggleBtn.textContent = '切换到捡瓶子模式';
        }

        // 如果已经捡过瓶子，显示瓶子内容
        if (userState.currentBottle) {
            this.elements.bottleWrapper.classList.remove('hidden');
            this.elements.bottleContentView.classList.remove('hidden');
            this.elements.visualBottle.classList.add('hidden');
            this.renderBottleContent(userState.currentBottle);

            // 在开发者模式下，按钮文本不变化
            if (!userState.devMode && userState.hasPickedToday) {
                this.elements.pickBtn.textContent = '今日已捡瓶';
            } else {
                this.elements.pickBtn.textContent = '捡起漂流瓶';
            }

            // 更新扇贝和鱼骨头按钮状态
            if (userState.currentBottle.liked) {
                this.elements.likeBtn.disabled = true;
                this.elements.dislikeBtn.disabled = true;  // 投了扇贝后，鱼骨头按钮也禁用
            } else if (userState.currentBottle.disliked) {
                this.elements.dislikeBtn.disabled = true;
                this.elements.likeBtn.disabled = true;  // 投了鱼骨头后，扇贝按钮也禁用
            } else {
                this.elements.likeBtn.disabled = false;
                this.elements.dislikeBtn.disabled = false;
            }

            // 检查是否已经保存过这个漂流瓶
            const savedBottles = JSON.parse(localStorage.getItem('savedBottles') || '[]');
            const isSaved = savedBottles.some(bottle => bottle.id === userState.currentBottle.id);
            this.elements.saveBtn.disabled = isSaved;
        } else {
            this.elements.bottleWrapper.classList.add('hidden');
            this.elements.pickBtn.textContent = '捡起漂流瓶';
        }
    }

    /**
     * 更新字符计数
     */
    updateCharCount() {
        const count = this.elements.messageInput.value.length;
        this.elements.charCount.textContent = count;
    }

    /**
     * 显示捡到的瓶子（此时是未打开状态）
     * @param {Object} bottle - 漂流瓶对象
     */
    showPickedBottle(bottle) {
        if (!bottle) return;

        // 1. 填充数据到隐藏的内容视图中
        this.renderBottleContent(bottle);

        // 2. 重置视图状态
        this.elements.bottleWrapper.classList.remove('hidden');
        this.elements.visualBottle.classList.remove('hidden'); // 显示瓶子图标
        this.elements.bottleContentView.classList.add('hidden'); // 隐藏信件内容

        // 3. 添加浮出水面的动画
        this.elements.visualBottle.classList.remove('anim-float-up');
        void this.elements.visualBottle.offsetWidth; // 触发重绘，重置动画
        this.elements.visualBottle.classList.add('anim-float-up');
    }

    /**
     * 打开瓶子
     * @param {Object} userState - 用户状态对象
     */
    openBottle(userState) {
        // 如果瓶子已经打开，则不再响应
        if (userState && userState.currentBottle && userState.currentBottle.isOpened && !userState.devMode) {
            return;
        }

        // 1. 隐藏瓶子图标
        this.elements.visualBottle.classList.add('hidden');

        // 2. 显示信件内容
        this.elements.bottleContentView.classList.remove('hidden');

        // 3. 添加内容淡入动画
        this.elements.bottleContentView.classList.add('anim-fade-in');
    }

    /**
     * 渲染瓶子内容
     * @param {Object} bottle - 漂流瓶对象
     */
    renderBottleContent(bottle) {
        this.elements.bottleMessage.textContent = bottle.message;
        this.elements.bottleAuthor.textContent = `作者: ${bottle.author || '匿名'}`;
        this.elements.bottleDate.textContent = `日期: ${bottle.date}`;
        this.elements.bottleLikes.textContent = bottle.likes;
        this.elements.bottleDislikes.textContent = bottle.dislikes;
        this.elements.bottleViews.textContent = bottle.views + 1; // 增加浏览次数
    }

    /**
     * 显示瓶子内容（已弃用，保留以确保兼容性）
     * @param {Object} bottle - 漂流瓶对象
     */
    displayBottle(bottle) {
        if (!bottle) return;
        this.showPickedBottle(bottle);
    }

    /**
     * 显示提示消息
     * @param {string} message - 要显示的消息内容
     * @param {string} type - 消息类型，默认为'info'，可选'success'或'error'
     */
    showToast(message, type = 'info') {
        // 设置消息文本内容
        this.elements.toast.textContent = message;
        // 重置toast的类名
        this.elements.toast.className = 'toast';

        // 根据消息类型添加对应的样式类
        if (type === 'success') {
            this.elements.toast.classList.add('success');
        } else if (type === 'error') {
            this.elements.toast.classList.add('error');
        }

        // 显示toast元素
        this.elements.toast.classList.remove('hidden');

        // 3秒后自动隐藏
        setTimeout(() => {
            this.elements.toast.classList.add('hidden');
        }, 3000);
    }

    /**
     * 处理标题点击事件
     * @param {Function} callback - 点击5次后的回调函数
     */
    handleTitleClick(callback) {
        this.titleClickCount++;

        // 清除之前的计时器
        if (this.titleClickTimer) {
            clearTimeout(this.titleClickTimer);
        }

        // 设置新的计时器，3秒后重置点击计数
        this.titleClickTimer = setTimeout(() => {
            this.titleClickCount = 0;
        }, 3000);

        // 如果点击了5次，显示开发者模式按钮
        if (this.titleClickCount === 5) {
            this.elements.devModeBtn.style.display = 'inline-block';
            this.showToast('开发者模式已解锁！', 'success');
            this.titleClickCount = 0;
            if (callback) callback();
        }
    }

    /**
     * 获取消息输入内容
     * @returns {string} 输入框内容
     */
    getMessageInput() {
        return this.elements.messageInput.value.trim();
    }

    /**
     * 清空消息输入框
     */
    clearMessageInput() {
        this.elements.messageInput.value = '';
        this.updateCharCount();
    }

    /**
     * 更新点赞数
     * @param {number} increment - 增量
     */
    updateLikesCount(increment = 1) {
        const currentCount = parseInt(this.elements.bottleLikes.textContent);
        this.elements.bottleLikes.textContent = currentCount + increment;
    }

    /**
     * 更新点踩数
     * @param {number} increment - 增量
     */
    updateDislikesCount(increment = 1) {
        const currentCount = parseInt(this.elements.bottleDislikes.textContent);
        this.elements.bottleDislikes.textContent = currentCount + increment;
    }

    /**
     * 禁用点赞和点踩按钮
     */
    disableLikeButtons() {
        this.elements.likeBtn.disabled = true;
        this.elements.dislikeBtn.disabled = true;
    }

    /**
     * 弹出输入框，让用户输入标注
     * @param {string} message - 提示消息
     * @returns {string|null} 用户输入的内容或null
     */
    promptForAnnotation(message) {
        return prompt(message, '');
    }
}

export { UIController };
