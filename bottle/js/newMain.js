
// 主入口文件 - 整合所有模块
import { authManager } from './auth.js';
import { bottleManager } from './bottle.js';

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 玩法说明按钮
  const howToPlayBtn = document.getElementById('how-to-play-btn');

  // 绑定玩法说明按钮点击事件
  howToPlayBtn.addEventListener('click', () => {
    showHowToPlay();
  });

  // 显示玩法说明
  function showHowToPlay() {
    const content = `
      <h2>漂流瓶玩法说明</h2>
      <p><strong>捡瓶子：</strong></p>
      <ul>
        <li>每天可以捡取一个漂流瓶</li>
        <li>点击"捡起漂流瓶"按钮获取随机漂流瓶</li>
        <li>点击瓶子打开查看内容</li>
        <li>可以对漂流瓶投扇贝(点赞)或鱼骨头(点踩)</li>
        <li>可以收藏喜欢的漂流瓶</li>
      </ul>

      <p><strong>写瓶子：</strong></p>
      <ul>
        <li>每天可以投放一个漂流瓶</li>
        <li>写下你想说的话(最多500字)</li>
        <li>点击"投入大海"按钮发布漂流瓶</li>
      </ul>

      <p><strong>登录用户特权：</strong></p>
      <ul>
        <li>可以创建和收藏漂流瓶</li>
        <li>可以查看自己的收藏列表</li>
      </ul>

      
    `;

    showModal('玩法说明', content);
  }

  // 显示模态框
  function showModal(title, content) {
    // 创建模态框元素
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>${title}</h2>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          <button class="primary-btn close-modal-btn">我知道了</button>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(modal);

    // 显示模态框
    modal.classList.remove('hidden');

    // 绑定关闭事件
    const closeBtn = modal.querySelector('.close-btn');
    const closeModalBtn = modal.querySelector('.close-modal-btn');

    const closeModal = () => {
      modal.classList.add('hidden');
      document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // 检查是否首次访问，显示欢迎信息
  const hasVisitedBefore = localStorage.getItem('bottleVisited');
  if (!hasVisitedBefore) {
    // 显示欢迎信息
    setTimeout(() => {
      const welcomeContent = `
        <p>欢迎来到漂流瓶世界！</p>
        <p>在这里，你可以捡起别人的漂流瓶，也可以写下自己的心声投入大海。</p>
        <p>每天只有一次捡取和投放的机会，请珍惜。</p>
      `;

      showModal('欢迎来到漂流瓶', welcomeContent);

      // 标记已访问
      localStorage.setItem('bottleVisited', 'true');
    }, 1000);
  }
});

// 导出全局对象，方便调试
window.bottleApp = {
  authManager,
  bottleManager
};
