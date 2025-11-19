/**
 * 存储服务模块
 * 负责处理所有与本地存储相关的操作
 */

/**
 * 存储服务类
 */
class StorageService {
    /**
     * 获取用户状态
     * @returns {Object} 用户状态对象
     */
    static getUserState() {
        const savedState = localStorage.getItem('bottleUserState');
        if (!savedState) {
            return {
                hasPickedToday: false,
                hasThrownToday: false,
                lastPickDate: null,
                lastThrowDate: null,
                currentView: 'pick', // 'pick' 或 'write'
                devMode: false, // 开发者模式标志
                viewedBottles: [], // 用户已看过的漂流瓶ID列表
                hasSeenTutorial: false, // 是否已看过教程（保留此变量以备将来使用）
                currentBottle: null
            };
        }

        const parsedState = JSON.parse(savedState);

        // 检查日期是否变化
        const today = new Date().toDateString();
        if (parsedState.lastPickDate !== today) {
            parsedState.hasPickedToday = false;
            // 如果是新的一天，重置当前瓶子状态，即使用户没有打开瓶子
            parsedState.currentBottle = null;
        }
        if (parsedState.lastThrowDate !== today) {
            parsedState.hasThrownToday = false;
        }

        // 确保开发者模式默认关闭
        parsedState.devMode = false;

        return parsedState;
    }

    /**
     * 保存用户状态
     * @param {Object} state - 用户状态对象
     */
    static setUserState(state) {
        const today = new Date().toDateString();
        state.lastPickDate = state.hasPickedToday ? today : state.lastPickDate;
        state.lastThrowDate = state.hasThrownToday ? today : state.lastThrowDate;

        // 确保保存当前瓶子状态
        if (state.currentBottle) {
            localStorage.setItem('bottleUserState', JSON.stringify(state));
        } else {
            // 如果没有当前瓶子，只保存基本状态
            const stateToSave = {
                ...state,
                currentBottle: null
            };
            localStorage.setItem('bottleUserState', JSON.stringify(stateToSave));
        }
    }

    /**
     * 获取用户创建的漂流瓶
     * @returns {Array} 用户创建的漂流瓶数组
     */
    static getUserCreatedBottles() {
        const userBottles = localStorage.getItem('userCreatedBottles');
        return userBottles ? JSON.parse(userBottles) : [];
    }

    /**
     * 设置用户创建的漂流瓶
     * @param {Array} bottles - 用户创建的漂流瓶数组
     */
    static setUserCreatedBottles(bottles) {
        localStorage.setItem('userCreatedBottles', JSON.stringify(bottles));
    }

    /**
     * 获取保存的漂流瓶
     * @returns {Array} 保存的漂流瓶数组
     */
    static getSavedBottles() {
        const savedBottles = localStorage.getItem('savedBottles');
        return savedBottles ? JSON.parse(savedBottles) : [];
    }

    /**
     * 设置保存的漂流瓶
     * @param {Array} bottles - 保存的漂流瓶数组
     */
    static setSavedBottles(bottles) {
        localStorage.setItem('savedBottles', JSON.stringify(bottles));
    }
}

export { StorageService };
