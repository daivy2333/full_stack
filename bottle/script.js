// DOM 元素
const pickBtn = document.getElementById('pick-btn');
const throwBtn = document.getElementById('throw-btn');
const toggleBtn = document.getElementById('toggle-btn');
const likeBtn = document.getElementById('like-btn');
const dislikeBtn = document.getElementById('dislike-btn');
const saveBtn = document.getElementById('save-btn');
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

// 玩法说明按钮
const howToPlayBtn = document.getElementById('how-to-play-btn');
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
    viewedBottles: [], // 用户已看过的漂流瓶ID列表
    hasSeenTutorial: false // 是否已看过教程（保留此变量以备将来使用）
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
    saveBtn.addEventListener('click', saveCurrentBottle);
    messageInput.addEventListener('input', updateCharCount);
    devModeBtn.addEventListener('click', toggleDevMode);

    // 标题点击事件监听器
    headerTitle.addEventListener('click', handleTitleClick);

    // 玩法说明按钮事件监听器
    howToPlayBtn.addEventListener('click', showTutorialBottle);

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

        // 确保开发者模式默认关闭
        parsedState.devMode = false;

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
        // 开发者模式下显示状态
        console.log('开发者模式已激活');
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

        // 检查是否已经保存过这个漂流瓶
        const savedBottles = JSON.parse(localStorage.getItem('savedBottles') || '[]');
        const isSaved = savedBottles.some(bottle => bottle.id === userState.currentBottle.id);
        saveBtn.disabled = isSaved;
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
/**
 * 点赞瓶子的函数
 * 当用户点击点赞按钮时触发此函数
 * 用于处理用户点赞瓶子的逻辑，包括更新状态和UI
 */
function likeBottle() {
    // 检查当前是否有瓶子或是否已经点赞过
    // 如果没有当前瓶子或已经点赞过，则直接返回，不执行任何操作
    if (!userState.currentBottle || userState.currentBottle.liked) return;



    // 更新瓶子状态
    userState.currentBottle.liked = true;    // 设置点赞状态为true
    userState.currentBottle.disliked = false; // 取消可能的踩状态

    // 更新UI中的点赞数
    // 将当前点赞数转换为整数并加1，然后更新显示
    bottleLikes.textContent = parseInt(bottleLikes.textContent) + 1;

    // 模拟增加瓶子的曝光度
    // 在实际应用中，这里会调用API更新数据库

    // 此处为模拟操作，实际项目中需要替换为真实的API调用
    // 显示提示消息
    // 使用toast通知用户点赞成功，并解释点赞的效果
    showToast('你投了一个扇贝，这个瓶子会被更多人看到！', 'success');

    // 禁用按钮 - 投扇贝后两个按钮都禁用

    // 防止用户重复点击，确保每个瓶子只能点赞一次
    likeBtn.disabled = true;    // 禁用点赞按钮
    dislikeBtn.disabled = true; // 禁用踩按钮
}

// 不喜欢瓶子（投鱼骨头）
/**
 * 处理用户对瓶子点踩的功能函数
 * 当用户不喜欢某个瓶子时调用此函数
 */
function dislikeBottle() {
    // 检查当前瓶子是否存在或已经被点踩过，如果是则直接返回
    if (!userState.currentBottle || userState.currentBottle.disliked) return;

    // 更新用户状态：标记当前瓶子被点踩，同时取消点赞状态
    userState.currentBottle.disliked = true;
    userState.currentBottle.liked = false;

    // 更新UI中的点踩数显示，将文本内容转换为数字并加1
    bottleDislikes.textContent = parseInt(bottleDislikes.textContent) + 1;

    // 模拟减少瓶子的曝光度
    // 在实际应用中，这里会调用API更新数据库

    // 这部分代码可能涉及后端API调用，用于更新瓶子的曝光度数据
    // 显示提示信息，告知用户操作成功
    showToast('你投了一个鱼骨头，这个瓶子会被减少曝光', 'success');

    // 禁用按钮 - 投鱼骨头后两个按钮都禁用，防止重复操作
    dislikeBtn.disabled = true;
    likeBtn.disabled = true;
}

// 显示提示消息
/**
 * 显示提示消息的函数
 * @param {string} message - 要显示的消息内容
 * @param {string} type - 消息类型，默认为'info'，可选'success'或'error'
 */
function showToast(message, type = 'info') {
    // 设置消息文本内容
    toast.textContent = message;
    // 重置toast的类名
    toast.className = 'toast';

    // 根据消息类型添加对应的样式类
    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'error') {
        toast.classList.add('error');
    }

    // 显示toast元素
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

// 显示玩法说明漂流瓶
function showTutorialBottle() {
    // 创建特殊的玩法说明漂流瓶
    const tutorialBottle = {
        id: 'tutorial',
        message: `真笨呢，不过没事啦，既然你不知道怎么做的那我就告诉你吧。如果望着大海，你会不会想着能够捡起一个漂流瓶
        去听听异国他乡的故事呢，又或许是来自美人鱼的赠言，又或许是海盗船长的野心，每天都能捡到一个哦，一定要来看看阿。如果你也想投入一个漂流瓶的话，也是每天一个不许多哦，写的好有贝壳，不好的会被扔骨头
        一定一定要用心的写，记得咯😘`,
        author: "系统",
        date: new Date().toISOString().split('T')[0],
        likes: 1314,
        dislikes: -520,
        views: 1
    };

    // 确保当前视图是捡瓶子模式
    if (userState.currentView !== 'pick') {
        userState.currentView = 'pick';
        updateUI();
    }

    // 更新状态
    userState.currentBottle = {
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
    updateUI();

    // 显示玩法说明瓶子
    bottleDisplay.classList.remove('hidden');
    bottleMessage.textContent = tutorialBottle.message;
    bottleAuthor.textContent = `作者: ${tutorialBottle.author}`;
    bottleDate.textContent = `日期: ${tutorialBottle.date}`;
    bottleLikes.textContent = tutorialBottle.likes;
    bottleDislikes.textContent = tutorialBottle.dislikes;
    bottleViews.textContent = tutorialBottle.views;

    // 禁用点赞和点踩按钮（因为是系统瓶子）
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;

    showToast('你捡到了一个特殊的漂流瓶！', 'success');
}

// 保存当前漂流瓶
function saveCurrentBottle() {
    if (!userState.currentBottle) {
        showToast('没有可保存的漂流瓶', 'error');
        return;
    }

    // 检查是否已经保存过这个漂流瓶
    const savedBottles = JSON.parse(localStorage.getItem('savedBottles') || '[]');
    const isSaved = savedBottles.some(bottle => bottle.id === userState.currentBottle.id);

    if (isSaved) {
        showToast('这个漂流瓶已经保存过了', 'error');
        return;
    }

    // 弹出输入框，让用户输入标注（最多10个字）
    const annotation = prompt('请为这个漂流瓶添加一个标注（最多10个字）：', '');

    if (annotation === null) {
        // 用户点击了取消
        return;
    }

    // 创建保存的漂流瓶对象
    const savedBottle = {
        ...userState.currentBottle,
        savedDate: new Date().toISOString(),
        annotation: annotation.trim().substring(0, 10) // 限制最多10个字
    };

    // 添加到保存列表
    savedBottles.push(savedBottle);
    localStorage.setItem('savedBottles', JSON.stringify(savedBottles));

    // 更新UI
    updateUI();

    showToast('漂流瓶已保存到收藏！', 'success');
}
