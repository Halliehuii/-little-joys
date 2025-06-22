'use client'

import { useState } from 'react'
import { signUp } from '@/lib/auth'
import { useAuthStore } from '@/lib/store/auth'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

interface RegisterFormProps {
  onSuccess?: () => void  // 注册成功后的回调函数
  onSwitchToLogin?: () => void  // 切换到登录的回调
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess, 
  onSwitchToLogin 
}) => {
  // 表单状态
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 从store获取设置用户信息的方法
  const { setUser, setLoading } = useAuthStore()

  // 密码强度验证
  const validatePassword = (password: string): boolean => {
    // 至少8位，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
    return passwordRegex.test(password)
  }

  // 处理注册提交
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

    if (!validatePassword(password)) {
      toast.error('密码至少8位，需包含字母和数字')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    try {
      setIsLoading(true)
      setLoading(true)
      
      // 调用注册API
      const result = await signUp(email, password)
      
      if (result.success) {
        if (result.user) {
          // 注册成功且用户已激活，更新全局状态
          setUser(result.user)
          toast.success('注册成功！')
          onSuccess?.()
        } else {
          // 注册成功但需要邮箱验证
          toast.success('注册成功！请查看邮箱验证邮件')
          // 可以选择切换到登录页面或显示验证页面
          onSwitchToLogin?.()
        }
      } else {
        // 注册失败，显示错误信息
        toast.error(result.error || '注册失败')
      }
    } catch (error) {
      console.error('注册错误:', error)
      toast.error('注册过程中发生错误')
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* 注册表单 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 邮箱输入框 */}
        <div className="relative">
          <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
            邮箱地址
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all"
              placeholder="请输入邮箱地址"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 密码输入框 */}
        <div className="relative">
          <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
            密码
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all"
              placeholder="至少8位，包含字母和数字"
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

        {/* 确认密码输入框 */}
        <div className="relative">
          <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
            确认密码
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all"
              placeholder="再次输入密码"
              required
              disabled={isLoading}
            />
            {/* 显示/隐藏密码按钮 */}
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* 注册按钮 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-medium"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>注册中...</span>
            </>
          ) : (
            <>
              <span>🎯</span>
              <span>立即注册</span>
            </>
          )}
        </button>
      </form>

      {/* 切换到登录 */}
      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            已有账号？
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-green-600 hover:text-green-500 ml-2 transition-colors"
              disabled={isLoading}
            >
              立即登录 →
            </button>
          </p>
        </div>
      )}
    </div>
  )
} 