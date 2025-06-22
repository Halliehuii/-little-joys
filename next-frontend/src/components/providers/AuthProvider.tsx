'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { onAuthStateChange, getCurrentUser } from '@/lib/auth'
import { Toaster } from 'react-hot-toast'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // 初始化认证状态
    const initAuth = async () => {
      try {
        setLoading(true)
        
        // 获取当前用户
        const result = await getCurrentUser()
        if (result.success && result.user) {
          setUser(result.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // 监听认证状态变化
    const { data: { subscription } } = onAuthStateChange((user) => {
      console.log('认证状态变化:', user ? '已登录' : '未登录')
      setUser(user)
    })

    // 初始化
    initAuth()

    // 清理函数
    return () => {
      subscription?.unsubscribe()
    }
  }, [setUser, setLoading])

  return (
    <>
      {children}
      {/* 全局Toast通知组件 */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
} 