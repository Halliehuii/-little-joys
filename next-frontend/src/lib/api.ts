import axios from 'axios'
import { getCurrentUserToken } from './auth'
import toast from 'react-hot-toast'

// 获取API基础URL
const getApiBaseUrl = () => {
  // 开发环境使用本地地址，生产环境使用线上地址
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000'
  } else {
    return 'https://api.littlejoys.xyz'
  }
}

// 创建axios实例
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000, // 增加超时时间以适应生产环境
  headers: {
    'Content-Type': 'application/json',
  }
})

// 添加请求日志（仅在开发环境）
if (process.env.NODE_ENV === 'development') {
  console.log(`🔗 API Base URL: ${getApiBaseUrl()}`)
}

// 请求拦截器 - 自动添加JWT Token到请求头
api.interceptors.request.use(
  (config) => {
    try {
      // 获取当前用户的JWT Token
      const token = getCurrentUserToken()
      
      if (token) {
        // 在请求头中添加Authorization字段
        config.headers.Authorization = `Bearer ${token}`
        
        // 开发环境下记录Token信息
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 添加Token到请求头: ${token.substring(0, 20)}...`)
        }
      } else {
        // 开发环境下记录没有Token的情况
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ 没有找到有效的Token')
        }
      }
      
      // 开发环境下记录请求信息
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`)
        console.log(`🔗 请求头Authorization: ${config.headers.Authorization ? '已设置' : '未设置'}`)
      }
    } catch (error) {
      console.error('获取Token失败:', error)
    }
    
    return config
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理响应和错误
api.interceptors.response.use(
  (response) => {
    // 开发环境下记录响应信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API响应: ${response.status} ${response.config.url}`)
    }
    
    // 成功响应直接返回数据
    return response
  },
  (error) => {
    // 开发环境下记录错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API错误:`, error)
    }
    
    // 错误响应处理
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Token无效或过期，清理认证状态并跳转到登录页面
          console.log('🔐 检测到认证失败，清理认证状态...')
          
          // 清理所有认证相关的localStorage
          const authKeys = ['access_token', 'refresh_token', 'user_info']
          authKeys.forEach(key => localStorage.removeItem(key))
          
          // 清理Supabase相关的存储
          const supabaseKeys = Object.keys(localStorage).filter(key => 
            key.includes('supabase') || key.includes('sb-')
          )
          supabaseKeys.forEach(key => localStorage.removeItem(key))
          
          // 清理Zustand持久化存储
          localStorage.removeItem('auth-storage')
          
          // 显示提示信息
          toast.error('登录已过期，请重新登录')
          
          // 延迟跳转，确保toast能显示
          setTimeout(() => {
            // 如果当前不在登录页面，则跳转到登录页面
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
          }, 1000)
          break
        case 403:
          // 没有权限访问
          toast.error('没有权限访问该资源')
          break
        case 404:
          // 资源不存在
          toast.error('请求的资源不存在')
          break
        case 500:
          // 服务器内部错误
          toast.error('服务器内部错误，请稍后重试')
          break
        case 502:
        case 503:
        case 504:
          // 网关错误或服务不可用
          toast.error('服务暂时不可用，请稍后重试')
          break
        default:
          // 其他错误
          const errorMessage = data?.message || data?.detail || '请求失败'
          toast.error(errorMessage)
      }
    } else if (error.request) {
      // 网络错误
      if (error.code === 'ECONNABORTED') {
        toast.error('请求超时，请检查网络连接')
      } else {
        toast.error('网络连接失败，请检查网络')
      }
    } else {
      // 其他错误
      toast.error('请求失败，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

// 导出配置好的axios实例
export default api

// 常用的API请求方法封装
export const apiRequest = {
  // GET请求
  get: <T = any>(url: string, params?: any) => 
    api.get<T>(url, { params }).then(res => res.data),
  
  // POST请求
  post: <T = any>(url: string, data?: any) => 
    api.post<T>(url, data).then(res => res.data),
  
  // PUT请求
  put: <T = any>(url: string, data?: any) => 
    api.put<T>(url, data).then(res => res.data),
  
  // DELETE请求
  delete: <T = any>(url: string) => 
    api.delete<T>(url).then(res => res.data),
  
  // PATCH请求
  patch: <T = any>(url: string, data?: any) => 
    api.patch<T>(url, data).then(res => res.data),
}

// 导出API基础URL获取函数，供其他组件使用
export { getApiBaseUrl } 