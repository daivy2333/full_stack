/**
 * 漂流瓶服务模块
 * 负责处理漂流瓶的数据操作，包括加载、保存、获取等
 */

import { StorageService } from './storageService.js';
import { Utils } from './utils.js';

/**
 * 漂流瓶服务类
 */
class BottleService {
    constructor() {
        this.bottles = [];
        this.originalBottlesCount = 10;
    }

    /**
     * 加载所有漂流瓶数据
     * @returns {Promise<Array>} 漂流瓶数组
     */
    async loadBottles() {
        try {
            const response = await fetch('bottles.json');
            const data = await response.json();
            this.bottles = data.bottles;
        } catch (error) {
            console.error('加载漂流瓶数据失败:', error);
            // 如果加载失败，使用默认数据
            this.bottles = [{
                id: 1,
                message: "今天天气真好，希望看到这条消息的人也能有个好心情！",
                author: "匿名用户",
                date: "2023-05-15",
                likes: 12,
                dislikes: 3,
                views: 156
            }];
        }

        // 加载用户创建的漂流瓶
        this.loadUserBottles();
        return this.bottles;
    }

    /**
     * 加载用户创建的漂流瓶
     */
    loadUserBottles() {
        const userBottles = StorageService.getUserCreatedBottles();
        if (userBottles) {
            this.bottles = [...this.bottles, ...userBottles];
        }
    }

    /**
     * 保存用户创建的漂流瓶
     */
    saveUserBottles() {
        const userCreatedBottles = this.bottles.slice(this.originalBottlesCount);
        StorageService.setUserCreatedBottles(userCreatedBottles);
    }

    /**
     * 创建新的漂流瓶
     * @param {string} message - 漂流瓶消息内容
     * @returns {Object} 新创建的漂流瓶对象
     */
    createBottle(message) {
        const newBottle = {
            id: this.bottles.length > 0 ? Math.max(...this.bottles.map(b => b.id)) + 1 : 1,
            message: message,
            author: "匿名用户",
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            dislikes: 0,
            views: 0
        };

        this.bottles.push(newBottle);
        this.saveUserBottles();
        return newBottle;
    }

    /**
     * 获取未看过的漂流瓶
     * @param {Array} viewedBottles - 已看过的漂流瓶ID列表
     * @returns {Object} 未看过的漂流瓶对象
     */
    getUnseenBottle(viewedBottles) {
        // 过滤出用户未看过的漂流瓶
        const unseenBottles = this.bottles.filter(bottle => !viewedBottles.includes(bottle.id));

        // 如果所有漂流瓶都看过了，重置列表
        if (unseenBottles.length === 0) {
            viewedBottles = [];
            return this.bottles[Math.floor(Math.random() * this.bottles.length)];
        }

        // 随机选择一个未看过的漂流瓶
        return unseenBottles[Math.floor(Math.random() * unseenBottles.length)];
    }

    /**
     * 创建教程漂流瓶
     * @returns {Object} 教程漂流瓶对象
     */
    createTutorialBottle() {
        return {
            id: 'tutorial',
            message: `真笨呢，不过没事啦，既然你不知道怎么做的那我就告诉你吧。如果望着大海，你会不会想着能够捡起一个漂流瓶
            去听听异国他乡的故事呢，又或许是来自美人鱼的赠言，又或许是海盗船长的野心，每天都能捡到一个哦，一定要来看看阿。如果你也想投入一个漂流瓶的话，也是每天一个不许多哦，写的好有贝壳，不好的会被扔骨头
            一定一定要用心的写，记得咯😘`,
            author: "123321",
            date: new Date().toISOString().split('T')[0],
            likes: 1314,
            dislikes: -520,
            views: 1
        };
    }

    /**
     * 保存漂流瓶到收藏
     * @param {Object} bottle - 要保存的漂流瓶
     * @param {string} annotation - 用户添加的标注
     * @returns {boolean} 保存是否成功
     */
    saveBottle(bottle, annotation) {
        if (!bottle) return false;

        const savedBottles = StorageService.getSavedBottles();
        const isSaved = savedBottles.some(b => b.id === bottle.id);

        if (isSaved) return false;

        const savedBottle = {
            ...bottle,
            savedDate: new Date().toISOString(),
            annotation: annotation.trim().substring(0, 10) // 限制最多10个字
        };

        savedBottles.push(savedBottle);
        StorageService.setSavedBottles(savedBottles);
        return true;
    }
}

export { BottleService };
