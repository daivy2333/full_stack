
// API模块 - 处理与后端的通信
class BottleAPI {
  constructor() {
    // API基础URL，根据实际情况修改
    this.baseURL = 'http://localhost:3000/api'; // 假设后端API地址
  }

  // 通用请求方法
  async request(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // 添加认证令牌
    const token = localStorage.getItem('bottleToken');
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const url = `${this.baseURL}/${endpoint}`;
      console.log('发送请求到:', url);
      console.log('请求方法:', method);
      console.log('请求数据:', data);

      const response = await fetch(url, options);
      console.log('响应状态:', response.status);

      const result = await response.json();
      console.log('响应数据:', result);

      if (!response.ok) {
        // 如果是401错误，清除token并提示用户登录
        if (response.status === 401) {
          localStorage.removeItem('bottleToken');
          localStorage.removeItem('bottleUser');
          throw new Error('请先登录');
        }
        
        // 尝试从响应中获取错误信息
        const errorMessage = result.error || result.message || `请求失败 (${response.status})`;
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  // 用户注册
  async registerUser(username, email, password) {
    // 在实际应用中，密码应该在前端进行哈希处理
    // 这里简化处理，直接发送密码
    return this.request('auth/register', 'POST', {
      username,
      email,
      password // 发送原始密码，后端会进行哈希处理
    });
  }

  // 用户登录
  async loginUser(username, password) {
    // 在实际应用中，密码应该在前端进行哈希处理
    return this.request('auth/login', 'POST', {
      username,
      password // 发送原始密码，后端会进行哈希处理
    });
  }

  // 获取用户信息
  async getUserInfo(userId) {
    return this.request(`get_user_info?userId=${userId}`);
  }

  // 获取用户状态
  async getUserState(userId) {
    return this.request(`user/state?userId=${userId}`);
  }

  // 更新用户状态
  async updateUserState(userId, state) {
    return this.request('user/state', 'PUT', {
      userId,
      ...state
    });
  }

  // 记录用户已捡起漂流瓶
  async recordBottlePicked(userId) {
    return this.request('user/pick', 'POST', {
      userId
    });
  }

  // 获取随机漂流瓶
  async getRandomBottle(userId) {
    console.log('API请求: 获取随机漂流瓶, userId:', userId);
    const endpoint = `bottles/random?userId=${userId}`;
    console.log('请求端点:', endpoint);
    const result = this.request(endpoint);
    console.log('API请求结果:', result);
    return result;
  }

  // 对漂流瓶做出反应（点赞/点踩）
  async reactToBottle(userId, bottleId, reactionType) {
    return this.request(`bottles/${bottleId}/react`, 'POST', {
      userId,
      reactionType
    });
  }

  // 获取漂流瓶详细信息
  async getBottleDetails(userId, bottleId) {
    return this.request(`bottles/${bottleId}?userId=${userId}`);
  }

  // 创建漂流瓶
  async createBottle(userId, message, authorName) {
    return this.request('bottles', 'POST', {
      userId,
      message,
      authorName
    });
  }

  // 获取用户收藏的漂流瓶
  async getUserSavedBottles(userId) {
    return this.request(`user/saves?userId=${userId}`);
  }

  // 收藏漂流瓶
  async saveBottle(userId, bottleId, annotation) {
    return this.request('user/saves', 'POST', {
      userId,
      bottleId,
      annotation
    });
  }

  // 取消收藏漂流瓶
  async unsaveBottle(userId, bottleId) {
    return this.request(`user/saves/${bottleId}`, 'DELETE', {
      userId
    });
  }

  // 获取系统统计信息
  async getSystemStats() {
    return this.request('get_system_stats');
  }

  // 删除漂流瓶（软删除）
  async deleteBottle(bottleId) {
    return this.request('delete_bottle', 'POST', {
      bottleId
    });
  }

  // 禁用用户
  async disableUser(userId) {
    return this.request('disable_user', 'POST', {
      userId
    });
  }

  // 启用用户
  async enableUser(userId) {
    return this.request('enable_user', 'POST', {
      userId
    });
  }
}

// 导出API实例
export const bottleAPI = new BottleAPI();
