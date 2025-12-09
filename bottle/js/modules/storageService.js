/**
 * 存储服务模块
 * 负责处理所有与API和本地存储相关的操作
 */

/**
 * 存储服务类
 */
class StorageService {
    // API基础URL
    static API_BASE_URL = 'http://localhost:3000/api';

    /**
     * 获取认证令牌
     * @returns {string|null} JWT令牌
     */
    static getToken() {
        return localStorage.getItem('driftBottleToken');
    }

    /**
     * 设置认证令牌
     * @param {string} token - JWT令牌
     */
    static setToken(token) {
        if (token) {
            localStorage.setItem('driftBottleToken', token);
        } else {
            localStorage.removeItem('driftBottleToken');
        }
    }

    /**
     * 获取用户信息
     * @returns {Object|null} 用户信息
     */
    static getUserInfo() {
        const userInfo = localStorage.getItem('driftBottleUser');
        return userInfo ? JSON.parse(userInfo) : null;
    }

    /**
     * 设置用户信息
     * @param {Object} user - 用户信息
     */
    static setUserInfo(user) {
        if (user) {
            localStorage.setItem('driftBottleUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('driftBottleUser');
        }
    }

    /**
     * 发送API请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} API响应
     */
    static async apiRequest(endpoint, options = {}) {
        const url = `${this.API_BASE_URL}${endpoint}`;

        // 设置默认请求头
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // 添加认证令牌
        const token = this.getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        // 合并请求选项
        const requestOptions = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();

            // 如果响应状态码不是2xx，抛出错误
            if (!response.ok) {
                throw new Error(data.error || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    /**
     * 获取用户状态
     * @returns {Promise<Object>} 用户状态对象
     */
    static async getUserState() {
        try {
            // 如果用户未登录，返回默认状态
            if (!this.getToken()) {
                return {
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

            // 从API获取用户状态
            const data = await this.apiRequest('/user/state');
            return {
                ...data,
                currentBottle: null,
                viewedBottles: []
            };
        } catch (error) {
            console.error('获取用户状态失败:', error);
            // 返回默认状态
            return {
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
    }

    /**
     * 保存用户状态
     * @param {Object} state - 用户状态对象
     * @returns {Promise<Object>} 更新后的用户状态
     */
    static async setUserState(state) {
        try {
            // 如果用户未登录，只保存到本地存储
            if (!this.getToken()) {
                localStorage.setItem('bottleUserState', JSON.stringify(state));
                return state;
            }

            // 发送状态更新到API
            const data = await this.apiRequest('/user/state', {
                method: 'PUT',
                body: JSON.stringify({
                    hasPickedToday: state.hasPickedToday,
                    hasThrownToday: state.hasThrownToday,
                    currentView: state.currentView,
                    devMode: state.devMode,
                    hasSeenTutorial: state.hasSeenTutorial
                })
            });

            return data;
        } catch (error) {
            console.error('保存用户状态失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户创建的漂流瓶（已弃用，改用API）
     * @returns {Array} 用户创建的漂流瓶数组
     */
    static getUserCreatedBottles() {
        // 此方法已弃用，漂流瓶数据现在从API获取
        return [];
    }

    /**
     * 设置用户创建的漂流瓶（已弃用，改用API）
     * @param {Array} bottles - 用户创建的漂流瓶数组
     */
    static setUserCreatedBottles(bottles) {
        // 此方法已弃用，漂流瓶数据现在通过API创建
    }

    /**
     * 获取保存的漂流瓶
     * @returns {Promise<Array>} 保存的漂流瓶数组
     */
    static async getSavedBottles() {
        try {
            // 如果用户未登录，返回空数组
            if (!this.getToken()) {
                return [];
            }

            // 从API获取保存的漂流瓶
            const data = await this.apiRequest('/user/saves');
            return data;
        } catch (error) {
            console.error('获取保存的漂流瓶失败:', error);
            return [];
        }
    }

    /**
     * 保存漂流瓶到收藏
     * @param {number} bottleId - 漂流瓶ID
     * @param {string} annotation - 标注
     * @returns {Promise<boolean>} 是否保存成功
     */
    static async saveBottle(bottleId, annotation) {
        try {
            await this.apiRequest('/user/saves', {
                method: 'POST',
                body: JSON.stringify({
                    bottleId,
                    annotation
                })
            });
            return true;
        } catch (error) {
            console.error('保存漂流瓶失败:', error);
            return false;
        }
    }

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<Object>} 登录结果
     */
    static async login(username, password) {
        try {
            const data = await this.apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    password
                })
            });

            // 保存令牌和用户信息
            this.setToken(data.token);
            this.setUserInfo(data.user);

            return data;
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }

    /**
     * 用户注册
     * @param {string} username - 用户名
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @returns {Promise<Object>} 注册结果
     */
    static async register(username, email, password) {
        try {
            const data = await this.apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            // 保存令牌和用户信息
            this.setToken(data.token);
            this.setUserInfo(data.user);

            return data;
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    }

    /**
     * 用户登出
     */
    static logout() {
        this.setToken(null);
        this.setUserInfo(null);
    }
}

export { StorageService };
