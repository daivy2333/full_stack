
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

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseURL}/${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '请求失败');
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
    return this.request('register_user', 'POST', {
      username,
      email,
      password_hash: password // 实际应该发送哈希值
    });
  }

  // 用户登录
  async loginUser(username, password) {
    // 在实际应用中，密码应该在前端进行哈希处理
    return this.request('login_user', 'POST', {
      username,
      password_hash: password // 实际应该发送哈希值
    });
  }

  // 获取用户信息
  async getUserInfo(userId) {
    return this.request(`get_user_info?userId=${userId}`);
  }

  // 获取用户状态
  async getUserState(userId) {
    return this.request(`get_user_state?userId=${userId}`);
  }

  // 更新用户状态
  async updateUserState(userId, state) {
    return this.request('update_user_state', 'POST', {
      userId,
      ...state
    });
  }

  // 记录用户已捡起漂流瓶
  async recordBottlePicked(userId) {
    return this.request('record_bottle_picked', 'POST', {
      userId
    });
  }

  // 获取随机漂流瓶
  async getRandomBottle(userId) {
    return this.request(`get_random_bottle_with_stats?userId=${userId}`);
  }

  // 对漂流瓶做出反应（点赞/点踩）
  async reactToBottle(userId, bottleId, reactionType) {
    return this.request('react_to_bottle', 'POST', {
      userId,
      bottleId,
      reactionType
    });
  }

  // 获取漂流瓶详细信息
  async getBottleDetails(userId, bottleId) {
    return this.request(`get_bottle_details?userId=${userId}&bottleId=${bottleId}`);
  }

  // 创建漂流瓶
  async createBottle(userId, message, authorName) {
    return this.request('create_bottle', 'POST', {
      userId,
      message,
      authorName
    });
  }

  // 获取用户收藏的漂流瓶
  async getUserSavedBottles(userId) {
    return this.request(`get_user_saved_bottles?userId=${userId}`);
  }

  // 收藏漂流瓶
  async saveBottle(userId, bottleId, annotation) {
    return this.request('save_bottle', 'POST', {
      userId,
      bottleId,
      annotation
    });
  }

  // 取消收藏漂流瓶
  async unsaveBottle(userId, bottleId) {
    return this.request('unsave_bottle', 'POST', {
      userId,
      bottleId
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
