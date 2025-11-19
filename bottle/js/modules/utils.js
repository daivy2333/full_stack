/**
 * 工具模块
 * 包含通用的工具函数
 */

/**
 * 工具类
 */
class Utils {
    /**
     * 格式化日期
     * @param {Date|string} date - 日期对象或日期字符串
     * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
     */
    static formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    /**
     * 生成随机ID
     * @returns {number} 随机ID
     */
    static generateId() {
        return Math.floor(Math.random() * 1000000);
    }

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    static debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * 生成随机字符串
     * @param {number} length - 字符串长度
     * @returns {string} 随机字符串
     */
    static randomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 检查是否为空值
     * @param {*} value - 要检查的值
     * @returns {boolean} 是否为空值
     */
    static isEmpty(value) {
        return value === null || value === undefined || value === '' || 
               (Array.isArray(value) && value.length === 0) || 
               (typeof value === 'object' && Object.keys(value).length === 0);
    }

    /**
     * 限制字符串长度
     * @param {string} str - 原始字符串
     * @param {number} maxLength - 最大长度
     * @param {string} suffix - 超出时的后缀，默认为'...'
     * @returns {string} 限制后的字符串
     */
    static limitStringLength(str, maxLength, suffix = '...') {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    }
}

export { Utils };
