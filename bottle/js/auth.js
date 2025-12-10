
// 用户认证模块
import { bottleAPI } from './api.js';

class AuthManager {
  constructor() {
    // 初始化用户状态
    this.currentUser = null;
    this.anonymousUserId = 1; // 匿名用户ID

    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  // 初始化方法
  init() {
    // 绑定DOM元素
    this.bindElements();

    // 绑定事件
    this.bindEvents();

    // 从本地存储中恢复登录状态
    this.restoreAuthState();
  }

  // 绑定DOM元素
  bindElements() {
    // 用户状态元素
    this.userGuestEl = document.getElementById('user-guest');
    this.userLoggedInEl = document.getElementById('user-logged-in');
    this.usernameEl = document.getElementById('username');

    // 认证按钮
    this.loginBtnEl = document.getElementById('login-btn');
    this.registerBtnEl = document.getElementById('register-btn');
    this.logoutBtnEl = document.getElementById('logout-btn');

    // 模态框
    this.loginModalEl = document.getElementById('login-modal');
    this.registerModalEl = document.getElementById('register-modal');

    // 表单
    this.loginFormEl = document.getElementById('login-form');
    this.registerFormEl = document.getElementById('register-form');

    // 切换按钮
    this.switchToRegisterBtnEl = document.getElementById('switch-to-register');
    this.switchToLoginBtnEl = document.getElementById('switch-to-login');

    // 关闭按钮
    this.closeBtns = document.querySelectorAll('.close-btn');
  }

  // 绑定事件
  bindEvents() {
    // 登录/注册按钮点击事件
    this.loginBtnEl.addEventListener('click', () => this.showLoginModal());
    this.registerBtnEl.addEventListener('click', () => this.showRegisterModal());
    this.logoutBtnEl.addEventListener('click', () => this.logout());

    // 表单提交事件
    this.loginFormEl.addEventListener('submit', (e) => this.handleLogin(e));
    this.registerFormEl.addEventListener('submit', (e) => this.handleRegister(e));

    // 切换表单按钮
    this.switchToRegisterBtnEl.addEventListener('click', () => {
      this.hideLoginModal();
      this.showRegisterModal();
    });

    this.switchToLoginBtnEl.addEventListener('click', () => {
      this.hideRegisterModal();
      this.showLoginModal();
    });

    // 关闭按钮
    this.closeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal === this.loginModalEl) {
          this.hideLoginModal();
        } else if (modal === this.registerModalEl) {
          this.hideRegisterModal();
        }
      });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
      if (e.target === this.loginModalEl) {
        this.hideLoginModal();
      } else if (e.target === this.registerModalEl) {
        this.hideRegisterModal();
      }
    });
  }

  // 从本地存储恢复认证状态
  restoreAuthState() {
    const savedUser = localStorage.getItem('bottleUser');
    const savedToken = localStorage.getItem('bottleToken');
    
    if (savedUser && savedToken) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.currentUser.token = savedToken;
        // 只有在DOM元素已经加载后才更新UI
        if (this.userGuestEl && this.userLoggedInEl) {
          this.updateUI();
        }
      } catch (error) {
        console.error('恢复用户状态失败:', error);
        localStorage.removeItem('bottleUser');
        localStorage.removeItem('bottleToken');
      }
    }
  }

  // 保存认证状态到本地存储
  saveAuthState() {
    if (this.currentUser) {
      localStorage.setItem('bottleUser', JSON.stringify(this.currentUser));
      if (this.currentUser.token) {
        localStorage.setItem('bottleToken', this.currentUser.token);
      }
    } else {
      localStorage.removeItem('bottleUser');
      localStorage.removeItem('bottleToken');
    }
  }

  // 显示登录模态框
  showLoginModal() {
    // 先隐藏注册模态框（如果打开了）
    this.registerModalEl.classList.remove('show');
    // 显示登录模态框
    this.loginModalEl.classList.add('show');
  }

  // 隐藏登录模态框
  hideLoginModal() {
    this.loginModalEl.classList.remove('show');
    this.loginFormEl.reset();
  }

  // 显示注册模态框
  showRegisterModal() {
    // 先隐藏登录模态框（如果打开了）
    this.loginModalEl.classList.remove('show');
    // 显示注册模态框
    this.registerModalEl.classList.add('show');
  }

  // 隐藏注册模态框
  hideRegisterModal() {
    this.registerModalEl.classList.remove('show');
    this.registerFormEl.reset();
  }

  // 处理登录
  async handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showToast('请输入用户名和密码');
      return;
    }

    try {
      // 显示加载指示器
      showLoading(true);

      // 调用API进行登录
      const response = await bottleAPI.loginUser(username, password);

      if (response.token) {
        // 登录成功
        this.currentUser = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          token: response.token
        };

        // 保存状态并更新UI
        this.saveAuthState();
        this.updateUI();

        // 隐藏模态框
        this.hideLoginModal();

        // 显示成功消息
        showToast(response.message || '登录成功');
      } else {
        // 登录失败
        showToast(response.message || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      showToast('登录失败，请稍后再试');
    } finally {
      // 隐藏加载指示器
      showLoading(false);
    }
  }

  // 处理注册
  async handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    // 表单验证
    if (!username || !email || !password || !confirmPassword) {
      showToast('请填写所有必填项');
      return;
    }

    if (password !== confirmPassword) {
      showToast('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      showToast('密码长度至少为6位');
      return;
    }

    try {
      // 显示加载指示器
      showLoading(true);

      // 调用API进行注册
      const response = await bottleAPI.registerUser(username, email, password);

      if (response.token) {
        // 注册成功
        this.currentUser = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          token: response.token
        };

        // 保存状态并更新UI
        this.saveAuthState();
        this.updateUI();

        // 隐藏模态框
        this.hideRegisterModal();

        // 显示成功消息
        showToast(response.message || '注册成功');
      } else {
        // 注册失败
        showToast(response.message || '注册失败');
      }
    } catch (error) {
      console.error('注册错误:', error);
      showToast('注册失败，请稍后再试');
    } finally {
      // 隐藏加载指示器
      showLoading(false);
    }
  }

  // 处理登出
  logout() {
    this.currentUser = null;
    this.saveAuthState();
    this.updateUI();
    showToast('已退出登录');
  }

  // 更新UI显示
  updateUI() {
    if (this.currentUser) {
      // 显示已登录状态
      this.userGuestEl.classList.add('hidden');
      this.userLoggedInEl.classList.remove('hidden');
      this.usernameEl.textContent = this.currentUser.username;
    } else {
      // 显示游客状态
      this.userGuestEl.classList.remove('hidden');
      this.userLoggedInEl.classList.add('hidden');
    }
  }

  // 获取当前用户ID
  getCurrentUserId() {
    return this.currentUser ? this.currentUser.id : this.anonymousUserId;
  }

  // 检查是否已登录
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // 获取当前用户信息
  getCurrentUser() {
    return this.currentUser;
  }
}

// 显示提示消息
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

// 显示/隐藏加载指示器
function showLoading(show) {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (show) {
    loadingIndicator.classList.remove('hidden');
  } else {
    loadingIndicator.classList.add('hidden');
  }
}

// 导出认证管理器实例
export const authManager = new AuthManager();

// 导出工具函数
export { showToast, showLoading };
