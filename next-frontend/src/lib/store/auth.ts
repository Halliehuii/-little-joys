import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { persist } from 'zustand/middleware'

// 认证状态类型定义
interface AuthState {
  user: User | null                    // 当前登录用户信息
  isLoading: boolean                   // 加载状态
  isAuthenticated: boolean             // 是否已认证
  
  // 操作方法
  setUser: (user: User | null) => void          // 设置用户信息
  setLoading: (loading: boolean) => void        // 设置加载状态
  clearUser: () => void                         // 清除用户信息
  updateUser: (userData: Partial<User>) => void // 更新用户信息
}

// 创建认证状态管理store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isLoading: false,
      isAuthenticated: false,

      // 设置用户信息
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: user !== null,
          isLoading: false
        })
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // 清除用户信息（登出时调用）
      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      // 更新用户信息（用于修改用户资料）
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData }
          })
        }
      }
    }),
    {
      name: 'auth-storage', // localStorage中的键名
      // 只持久化用户基本信息，不持久化敏感数据
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
) 