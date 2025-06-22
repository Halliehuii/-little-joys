'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
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
        
        // 检查环境变量
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) {
          console.warn('⚠️ Supabase 环境变量未配置，跳过认证初始化')
          setUser(null)
          return
        }
        
        // 动态导入认证函数，避免模块级别的错误
        const { getCurrentUser, onAuthStateChange } = await import('../../lib/auth')
        
        // 获取当前用户
        const result = await getCurrentUser()
        if (result.success && result.user) {
          setUser(result.user)
          console.log('✅ 用户认证状态已恢复')
        } else {
          setUser(null)
          console.log('ℹ️ 用户未登录')
        }
        
        // 监听认证状态变化
        const { data: { subscription } } = onAuthStateChange((user) => {
          console.log('🔄 认证状态变化:', user ? '已登录' : '未登录')
          setUser(user)
        })
        
        // 保存订阅以便清理
        return () => {
          subscription?.unsubscribe()
        }
        
      } catch (error: any) {
        console.warn('⚠️ 认证初始化失败，但应用将继续运行:', error?.message || error)
        setUser(null)
        
        // 如果是网络错误或 Supabase 不可用，不抛出错误
        if (error?.message?.includes('fetch') || 
            error?.message?.includes('network') ||
            error?.message?.includes('supabase')) {
          console.log('🔧 建议检查 Supabase 配置和网络连接')
        }
      } finally {
        setLoading(false)
      }
    }

    // 执行初始化
    let cleanup: (() => void) | undefined
    initAuth().then((cleanupFn) => {
      cleanup = cleanupFn
    }).catch((error) => {
      console.warn('认证初始化异常:', error)
      setLoading(false)
      setUser(null)
    })

    // 清理函数
    return () => {
      if (cleanup) {
        cleanup()
      }
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