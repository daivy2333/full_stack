// DOM 元素
const pickBtn = document.getElementById('pick-btn');
const throwBtn = document.getElementById('throw-btn');
const toggleBtn = document.getElementById('toggle-btn');
const likeBtn = document.getElementById('like-btn');
const dislikeBtn = document.getElementById('dislike-btn');
const bottleDisplay = document.getElementById('bottle-display');
const bottleMessage = document.getElementById('bottle-message');
const bottleAuthor = document.getElementById('bottle-author');
const bottleDate = document.getElementById('bottle-date');
const bottleLikes = document.getElementById('bottle-likes');
const bottleDislikes = document.getElementById('bottle-dislikes');
const bottleViews = document.getElementById('bottle-views');
const messageInput = document.getElementById('message-input');
const charCount = document.getElementById('char-count');
const pickBottle = document.getElementById('pick-bottle');
const writeBottle = document.getElementById('write-bottle');
const pickStatus = document.getElementById('pick-status');
const throwStatus = document.getElementById('throw-status');
const toast = document.getElementById('toast');
const devModeBtn = document.getElementById('dev-mode-btn');
const headerTitle = document.querySelector('header h1');

// 漂流瓶数据库
let bottles = [];
let viewedBottles = []; // 用户已看过的漂流瓶ID列表

// 用户状态
let userState = {
    hasPickedToday: false,
    hasThrownToday: false,
    lastPickDate: null,
    lastThrowDate: null,
    currentView: 'pick', // 'pick' 或 'write'
    devMode: false, // 开发者模式标志
    viewedBottles: [] // 用户已看过的漂流瓶ID列表
};

// 开发者模式相关变量
let titleClickCount = 0;
let titleClickTimer = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载漂流瓶数据
    loadBottles();

    // 检查本地存储的用户状态
    loadUserState();
    updateUI();

    // 设置事件监听器
    pickBtn.addEventListener('click', pickBottleFromSea);
    throwBtn.addEventListener('click', throwBottleToSea);
    toggleBtn.addEventListener('click', toggleView);
    likeBtn.addEventListener('click', likeBottle);
    dislikeBtn.addEventListener('click', dislikeBottle);
    messageInput.addEventListener('input', updateCharCount);
    devModeBtn.addEventListener('click', toggleDevMode);

    // 标题点击事件监听器
    headerTitle.addEventListener('click', handleTitleClick);

    // 初始隐藏开发者模式按钮
    devModeBtn.style.display = 'none';
});

// 加载漂流瓶数据
async function loadBottles() {
    try {
        const response = await fetch('bottles.json');
        const data = await response.json();
        bottles = data.bottles;
    } catch (error) {
        console.error('加载漂流瓶数据失败:', error);
        // 如果加载失败，使用默认数据
        bottles = [
            {
                id: 1,
                message: "今天天气真好，希望看到这条消息的人也能有个好心情！",
                author: "匿名用户",
                date: "2023-05-15",
                likes: 12,
                dislikes: 3,
                views: 156
            }
        ];
    }

    // 加载用户创建的漂流瓶
    loadUserBottles();
}

// 加载用户创建的漂流瓶
function loadUserBottles() {
    const userBottles = localStorage.getItem('userCreatedBottles');
    if (userBottles) {
        const parsedBottles = JSON.parse(userBottles);
        // 将用户创建的漂流瓶添加到列表中
        bottles = [...bottles, ...parsedBottles];
    }
}

// 保存用户创建的漂流瓶
function saveUserBottles() {
    // 获取用户创建的漂流瓶（ID大于原始JSON中最大ID的漂流瓶）
    const originalBottlesCount = 10; // 原始JSON中的漂流瓶数量
    const userCreatedBottles = bottles.slice(originalBottlesCount);
    localStorage.setItem('userCreatedBottles', JSON.stringify(userCreatedBottles));
}

// 加载用户状态
function loadUserState() {
    const savedState = localStorage.getItem('bottleUserState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);

        // 检查日期是否变化
        const today = new Date().toDateString();
        if (parsedState.lastPickDate !== today) {
            parsedState.hasPickedToday = false;
            // 如果是新的一天，重置当前瓶子状态
            parsedState.currentBottle = null;
        }
        if (parsedState.lastThrowDate !== today) {
            parsedState.hasThrownToday = false;
        }

        userState = parsedState;

        // 恢复已看过的漂流瓶列表
        viewedBottles = userState.viewedBottles || [];
    }
}

// 保存用户状态
function saveUserState() {
    const today = new Date().toDateString();
    userState.lastPickDate = userState.hasPickedToday ? today : userState.lastPickDate;
    userState.lastThrowDate = userState.hasThrownToday ? today : userState.lastThrowDate;

    // 保存已看过的漂流瓶列表
    userState.viewedBottles = viewedBottles;

    // 确保保存当前瓶子状态
    if (userState.currentBottle) {
        localStorage.setItem('bottleUserState', JSON.stringify(userState));
    } else {
        // 如果没有当前瓶子，只保存基本状态
        const stateToSave = {
            ...userState,
            currentBottle: null
        };
        localStorage.setItem('bottleUserState', JSON.stringify(stateToSave));
    }
}

// 更新UI
function updateUI() {
    // 更新状态显示
    if (userState.devMode) {
        pickStatus.textContent = '开发者模式';
        throwStatus.textContent = '开发者模式';
    } else {
        pickStatus.textContent = userState.hasPickedToday ? '已捡取' : '未捡取';
        throwStatus.textContent = userState.hasThrownToday ? '已投递' : '未投递';
    }

    // 更新按钮状态
    pickBtn.disabled = !userState.devMode && userState.hasPickedToday;
    throwBtn.disabled = !userState.devMode && (userState.hasThrownToday || messageInput.value.trim() === '');

    // 更新视图
    if (userState.currentView === 'pick') {
        pickBottle.classList.remove('hidden');
        writeBottle.classList.add('hidden');
        toggleBtn.textContent = '切换到写瓶子模式';
    } else {
        pickBottle.classList.add('hidden');
        writeBottle.classList.remove('hidden');
        toggleBtn.textContent = '切换到捡瓶子模式';
    }

    // 如果已经捡过瓶子，显示瓶子内容
    if (userState.currentBottle) {
        bottleDisplay.classList.remove('hidden');
        bottleMessage.textContent = userState.currentBottle.message;

        // 在开发者模式下，按钮文本不变化
        if (!userState.devMode && userState.hasPickedToday) {
            pickBtn.textContent = '今日已捡瓶';
        } else {
            pickBtn.textContent = '捡起漂流瓶';
        }

        // 更新扇贝和鱼骨头按钮状态
        if (userState.currentBottle.liked) {
            likeBtn.disabled = true;
            dislikeBtn.disabled = true;  // 投了扇贝后，鱼骨头按钮也禁用
        } else if (userState.currentBottle.disliked) {
            dislikeBtn.disabled = true;
            likeBtn.disabled = true;  // 投了鱼骨头后，扇贝按钮也禁用
        } else {
            likeBtn.disabled = false;
            dislikeBtn.disabled = false;
        }
    } else {
        bottleDisplay.classList.add('hidden');
        pickBtn.textContent = '捡起漂流瓶';
    }
}

// 切换视图
function toggleView() {
    userState.currentView = userState.currentView === 'pick' ? 'write' : 'pick';
    updateUI();
}

// 更新字符计数
function updateCharCount() {
    const count = messageInput.value.length;
    charCount.textContent = count;
    throwBtn.disabled = userState.hasThrownToday || count === 0;
}

// 获取未看过的漂流瓶
function getUnseenBottle() {
    // 过滤出用户未看过的漂流瓶
    const unseenBottles = bottles.filter(bottle => !viewedBottles.includes(bottle.id));

    // 如果所有漂流瓶都看过了，重置列表
    if (unseenBottles.length === 0) {
        viewedBottles = [];
        return bottles[Math.floor(Math.random() * bottles.length)];
    }

    // 随机选择一个未看过的漂流瓶
    return unseenBottles[Math.floor(Math.random() * unseenBottles.length)];
}

// 捡漂流瓶
function pickBottleFromSea() {
    if (!userState.devMode && userState.hasPickedToday) {
        showToast('今天已经捡过漂流瓶了，明天再来吧！', 'error');
        return;
    }

    // 获取一个未看过的漂流瓶
    const bottle = getUnseenBottle();

    if (!bottle) {
        showToast('大海中没有漂流瓶了，明天再来吧！', 'error');
        return;
    }

    // 将漂流瓶ID添加到已看列表
    viewedBottles.push(bottle.id);

    // 更新状态
    userState.hasPickedToday = true;
    userState.currentBottle = {
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
    updateUI();
    saveUserState();

    // 显示捡到的瓶子
    bottleDisplay.classList.remove('hidden');
    bottleMessage.textContent = bottle.message;
    bottleAuthor.textContent = `作者: ${bottle.author}`;
    bottleDate.textContent = `日期: ${bottle.date}`;
    bottleLikes.textContent = bottle.likes;
    bottleDislikes.textContent = bottle.dislikes;
    bottleViews.textContent = bottle.views + 1; // 增加浏览次数

    showToast('你捡到了一个漂流瓶！', 'success');
}

// 投漂流瓶
function throwBottleToSea() {
    if (!userState.devMode && userState.hasThrownToday) {
        showToast('今天已经投过漂流瓶了，明天再来吧！', 'error');
        return;
    }

    const message = messageInput.value.trim();
    if (message === '') {
        showToast('请写下你想说的话', 'error');
        return;
    }

    // 创建新的漂流瓶对象
    const newBottle = {
        id: bottles.length > 0 ? Math.max(...bottles.map(b => b.id)) + 1 : 1,
        message: message,
        author: "匿名用户",
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        dislikes: 0,
        views: 0
    };

    // 将新漂流瓶添加到数据库
    bottles.push(newBottle);

    // 保存用户创建的漂流瓶
    saveUserBottles();

    // 更新状态
    userState.hasThrownToday = true;

    // 清空输入框
    messageInput.value = '';
    updateCharCount();

    // 更新UI
    updateUI();
    saveUserState();

    showToast('你的漂流瓶已投入大海！', 'success');
}

// 喜欢瓶子（投扇贝）
function likeBottle() {
    if (!userState.currentBottle || userState.currentBottle.liked) return;

    userState.currentBottle.liked = true;
    userState.currentBottle.disliked = false;

    // 更新UI中的点赞数
    bottleLikes.textContent = parseInt(bottleLikes.textContent) + 1;

    // 模拟增加瓶子的曝光度
    // 在实际应用中，这里会调用API更新数据库

    showToast('你投了一个扇贝，这个瓶子会被更多人看到！', 'success');

    // 禁用按钮 - 投扇贝后两个按钮都禁用
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;
}

// 不喜欢瓶子（投鱼骨头）
function dislikeBottle() {
    if (!userState.currentBottle || userState.currentBottle.disliked) return;

    userState.currentBottle.disliked = true;
    userState.currentBottle.liked = false;

    // 更新UI中的点踩数
    bottleDislikes.textContent = parseInt(bottleDislikes.textContent) + 1;

    // 模拟减少瓶子的曝光度
    // 在实际应用中，这里会调用API更新数据库

    showToast('你投了一个鱼骨头，这个瓶子会被减少曝光', 'success');

    // 禁用按钮 - 投鱼骨头后两个按钮都禁用
    dislikeBtn.disabled = true;
    likeBtn.disabled = true;
}

// 显示提示消息
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast';

    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'error') {
        toast.classList.add('error');
    }

    toast.classList.remove('hidden');

    // 3秒后自动隐藏
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// 处理标题点击事件
function handleTitleClick() {
    titleClickCount++;

    // 清除之前的计时器
    if (titleClickTimer) {
        clearTimeout(titleClickTimer);
    }

    // 设置新的计时器，3秒后重置点击计数
    titleClickTimer = setTimeout(() => {
        titleClickCount = 0;
    }, 3000);

    // 如果点击了5次，显示开发者模式按钮
    if (titleClickCount === 5) {
        devModeBtn.style.display = 'inline-block';
        showToast('开发者模式已解锁！', 'success');
        titleClickCount = 0;
    }
}

// 开发者模式
function toggleDevMode() {
    // 切换开发者模式状态
    userState.devMode = !userState.devMode;

    if (userState.devMode) {
        // 开启开发者模式时，重置所有状态
        userState.hasPickedToday = false;
        userState.hasThrownToday = false;
        userState.currentBottle = null;

        // 显示提示
        showToast('开发者模式已激活，所有限制已重置', 'success');
    } else {
        // 关闭开发者模式时，重置状态
        userState.hasPickedToday = false;
        userState.hasThrownToday = false;
        userState.currentBottle = null;

        // 显示提示
        showToast('开发者模式已关闭，恢复正常限制', 'info');
    }

    // 更新UI
    updateUI();
    saveUserState();
}