/**
 * 认证工具模块
 * 统一管理用户登录状态和Token
 */

import { toast } from 'react-hot-toast'

// Token存储的key名称
const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user_info'

export interface UserInfo {
  id: string
  email: string
  nickname?: string
  avatar_url?: string
}

export class AuthManager {
  /**
   * 保存认证信息到本地存储
   */
  static saveAuth(accessToken: string, refreshToken?: string, userInfo?: UserInfo) {
    localStorage.setItem(TOKEN_KEY, accessToken)
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
    if (userInfo) {
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo))
    }
  }

  /**
   * 获取访问Token
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  /**
   * 获取刷新Token
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  /**
   * 获取用户信息
   */
  static getUserInfo(): UserInfo | null {
    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  /**
   * 检查是否已登录
   */
  static isLoggedIn(): boolean {
    const token = this.getAccessToken()
    return !!token && !this.isTokenExpired(token)
  }

  /**
   * 检查Token是否过期
   */
  static isTokenExpired(token: string): boolean {
    try {
      // 解析JWT Token的payload部分
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      // 检查是否过期（提前30秒判断，避免边界情况）
      return payload.exp && payload.exp < currentTime + 30
    } catch {
      // 如果无法解析，认为已过期
      return true
    }
  }

  /**
   * 清除认证信息
   */
  static logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  /**
   * 检查并处理Token状态
   * 返回有效的Token，如果Token无效则自动跳转到登录页
   */
  static async ensureValidToken(): Promise<string | null> {
    const token = this.getAccessToken()
    
    if (!token) {
      this.handleAuthError('未登录，请先登录')
      return null
    }

    if (this.isTokenExpired(token)) {
      // Token过期，尝试刷新
      const refreshed = await this.tryRefreshToken()
      if (!refreshed) {
        this.handleAuthError('登录已过期，请重新登录')
        return null
      }
      return this.getAccessToken()
    }

    return token
  }

  /**
   * 尝试刷新Token
   */
  static async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return false
    }

    try {
      // 这里需要根据你的Supabase配置调用refresh API
      // 由于你使用的是Supabase，这里需要使用Supabase的刷新机制
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.access_token) {
          this.saveAuth(data.access_token, data.refresh_token)
          return true
        }
      }
    } catch (error) {
      console.error('Token刷新失败:', error)
    }

    return false
  }

  /**
   * 处理认证错误
   */
  static handleAuthError(message: string) {
    this.logout()
    toast.error(message)
    
    // 延迟跳转，确保toast消息能显示
    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  }

  /**
   * 创建带认证的请求头
   */
  static getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
}

// 导出便捷方法
export const {
  saveAuth,
  getAccessToken,
  getRefreshToken,
  getUserInfo,
  isLoggedIn,
  logout,
  ensureValidToken,
  handleAuthError,
  getAuthHeaders
} = AuthManager 