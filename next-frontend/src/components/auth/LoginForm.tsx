'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth'
import { useAuthStore } from '@/lib/store/auth'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void  // 登录成功后的回调函数
  onSwitchToRegister?: () => void  // 切换到注册的回调
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  onSwitchToRegister 
}) => {
  // 表单状态
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 从store获取设置用户信息的方法
  const { setUser, setLoading } = useAuthStore()

  // 处理登录提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 基本表单验证
    if (!email.trim()) {
      toast.error('请输入邮箱地址')
      return
    }
    
    if (!password.trim()) {
      toast.error('请输入密码')
      return
    }

    try {
      setIsLoading(true)
      setLoading(true)
      
      // 调用登录API
      const result = await signIn(email, password)
      
      if (result.success && result.user) {
        // 登录成功，更新全局状态
        setUser(result.user)
        toast.success('登录成功！')
        
        // 调用成功回调
        onSuccess?.()
      } else {
        // 登录失败，显示错误信息
        toast.error(result.error || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      toast.error('登录过程中发生错误')
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* 登录表单 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 邮箱输入框 */}
        <div className="relative">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            邮箱地址
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
              placeholder="请输入邮箱地址"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 密码输入框 */}
        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            密码
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
              placeholder="请输入密码"
              required
              disabled={isLoading}
            />
            {/* 显示/隐藏密码按钮 */}
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-medium"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>登录中...</span>
            </>
          ) : (
            <>
              <span>📧</span>
              <span>立即登录</span>
            </>
          )}
        </button>
      </form>

      {/* 切换到注册 */}
      {onSwitchToRegister && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            还没有账号？
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-medium text-blue-600 hover:text-blue-500 ml-2 transition-colors"
              disabled={isLoading}
            >
              立即注册 →
            </button>
          </p>
        </div>
      )}
    </div>
  )
} 