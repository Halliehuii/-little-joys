import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

// 认证结果类型
interface AuthResult {
  success: boolean
  error?: string
  user?: User
}

// 登录函数
export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // 登录成功后，保存Token到我们约定的localStorage键
    if (data.session) {
      localStorage.setItem('access_token', data.session.access_token)
      if (data.session.refresh_token) {
        localStorage.setItem('refresh_token', data.session.refresh_token)
      }
      if (data.user) {
        localStorage.setItem('user_info', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          nickname: data.user.user_metadata?.nickname
        }))
      }
    }

    return { success: true, user: data.user || undefined }
  } catch (error) {
    return { success: false, error: '登录过程中发生错误' }
  }
}

// 注册函数
export const signUp = async (email: string, password: string, nickname?: string): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname || email.split('@')[0]
        }
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, user: data.user || undefined }
  } catch (error) {
    return { success: false, error: '注册过程中发生错误' }
  }
}

// 登出函数
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    // 清除本地存储（包括我们的自定义键和Supabase的键）
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
    
    // 清除Supabase的默认存储
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-')
    )
    keys.forEach(key => localStorage.removeItem(key))

    return { success: true }
  } catch (error) {
    return { success: false, error: '登出过程中发生错误' }
  }
}

// 获取当前用户
export const getCurrentUser = async (): Promise<AuthResult> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, user: user || undefined }
  } catch (error) {
    return { success: false, error: '获取用户信息失败' }
  }
}

// 获取当前用户的JWT Token
export const getCurrentUserToken = (): string | null => {
  try {
    // 首先尝试从我们的约定键获取
    if (typeof window === 'undefined') return null
    
    let token = localStorage.getItem('access_token')
    
    // 检查token是否过期
    if (token && isTokenExpired(token)) {
      console.log('🔐 检测到token已过期，清理认证状态')
      // Token过期，清理相关存储
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_info')
      localStorage.removeItem('auth-storage')
      return null
    }
    
    if (token) {
      return token
    }
    
    // 如果没有，尝试从Supabase的默认存储获取
    const authData = localStorage.getItem('sb-qnwmhygvvfgwucatdopx-auth-token')
    if (authData) {
      const session = JSON.parse(authData)
      token = session?.access_token || null
      
      // 检查从Supabase获取的token是否过期
      if (token && isTokenExpired(token)) {
        console.log('🔐 从Supabase获取的token已过期')
        localStorage.removeItem('sb-qnwmhygvvfgwucatdopx-auth-token')
        return null
      }
      
      // 如果找到了有效token，同步到我们的键
      if (token) {
        localStorage.setItem('access_token', token)
        if (session.refresh_token) {
          localStorage.setItem('refresh_token', session.refresh_token)
        }
      }
      
      return token
    }
    
    // 最后，尝试检查其他可能的Supabase存储键
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    )
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.access_token) {
          // 检查token是否过期
          if (isTokenExpired(data.access_token)) {
            localStorage.removeItem(key)
            continue
          }
          
          // 同步到我们的键
          localStorage.setItem('access_token', data.access_token)
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token)
          }
          return data.access_token
        }
      } catch (e) {
        continue
      }
    }
    
    return null
  } catch (error) {
    console.error('获取Token失败:', error)
    return null
  }
}

// 检查JWT token是否过期
const isTokenExpired = (token: string): boolean => {
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

// 监听认证状态变化
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  // 监听认证状态变化事件
  return supabase.auth.onAuthStateChange((event: any, session: any) => {
    callback(session?.user || null)
  })
}

// 检查用户是否已登录
export const isAuthenticated = (): boolean => {
  const token = getCurrentUserToken()
  return !!token
}

/**
 * 初始化认证状态
 * 在应用启动时调用，检查本地存储的token是否有效
 */
export const initializeAuth = async (): Promise<void> => {
  try {
    const token = getCurrentUserToken()
    if (!token) {
      return
    }

    // 检查token是否有效
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      // token无效，清除相关的本地存储
      const keys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth')
      )
      keys.forEach(key => localStorage.removeItem(key))
      
      // 通知Zustand store清除状态
      const authStore = require('@/lib/store/auth').useAuthStore
      authStore.getState().clearUser()
      return
    }

    // token有效，更新Zustand store状态
    const authStore = require('@/lib/store/auth').useAuthStore
    authStore.getState().setUser({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at || new Date().toISOString()
    })
  } catch (error) {
    console.error('初始化认证状态失败:', error)
    // 出错时也清除状态
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('auth')
    )
    keys.forEach(key => localStorage.removeItem(key))
    
    const authStore = require('@/lib/store/auth').useAuthStore
    authStore.getState().clearUser()
  }
}

// 重置密码
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: '发送重置邮件失败' }
  }
}

/**
 * 调试认证状态 - 帮助诊断认证问题
 */
export const debugAuthState = () => {
  console.log('🔍 认证状态调试信息:')
  console.log('1. localStorage keys:', Object.keys(localStorage).filter(key => 
    key.includes('auth') || key.includes('token') || key.includes('supabase') || key.includes('sb-')
  ))
  
  const token = getCurrentUserToken()
  console.log('2. 当前Token:', token ? `${token.substring(0, 20)}...` : '无')
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = new Date(payload.exp * 1000)
      const now = new Date()
      console.log('3. Token过期时间:', exp.toLocaleString())
      console.log('4. 当前时间:', now.toLocaleString())
      console.log('5. Token是否过期:', exp < now)
      console.log('6. 用户ID:', payload.sub)
      console.log('7. 邮箱:', payload.email)
    } catch (e) {
      console.log('3. Token解析失败:', e)
    }
  }
  
  return {
    hasToken: !!token,
    tokenValid: token ? !isTokenExpired(token) : false,
    isAuthenticated: isAuthenticated()
  }
} 