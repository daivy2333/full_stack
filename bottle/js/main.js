/**
 * 主入口文件
 * 负责初始化应用
 */

import { AppController } from './modules/appController.js';

/**
 * 应用初始化函数
 */
async function initApp() {
    try {
        // 创建应用控制器实例
        const appController = new AppController();

        // 初始化应用
        await appController.init();

        // 将应用控制器实例暴露到全局，以便调试
        window.app = appController;

        console.log('漂流瓶应用初始化成功');
    } catch (error) {
        console.error('应用初始化失败:', error);
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
