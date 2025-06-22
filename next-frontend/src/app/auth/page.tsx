'use client'

import { useState, useEffect } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuthStore } from '@/lib/store/auth'
import { signOut, getCurrentUserToken } from '@/lib/auth'
import { apiRequest } from '@/lib/api'
import toast from 'react-hot-toast'
import { User, LogOut, Settings } from 'lucide-react'

export default function AuthPage() {
  // 认证状态
  const { user, isAuthenticated, clearUser } = useAuthStore()
  
  // 组件状态
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login')
  const [userProfile, setUserProfile] = useState(null)
  const [tokenInfo, setTokenInfo] = useState(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // 处理登录成功
  const handleAuthSuccess = () => {
    toast.success('认证成功！')
    loadUserProfile()
    loadTokenInfo()
  }

  // 处理登出
  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        clearUser()
        setUserProfile(null)
        setTokenInfo(null)
        toast.success('登出成功！')
      } else {
        toast.error(result.error || '登出失败')
      }
    } catch (error) {
      console.error('登出错误:', error)
      toast.error('登出过程中发生错误')
    }
  }

  // 加载用户资料
  const loadUserProfile = async () => {
    if (!isAuthenticated) return
    
    try {
      setIsLoadingProfile(true)
      const profile = await apiRequest.get('/api/v1/auth/me')
      setUserProfile(profile.data)
    } catch (error) {
      console.error('加载用户资料失败:', error)
      toast.error('加载用户资料失败')
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // 加载Token信息
  const loadTokenInfo = async () => {
    if (!isAuthenticated) return
    
    try {
      const info = await apiRequest.get('/api/v1/auth/info')
      setTokenInfo(info.data)
    } catch (error) {
      console.error('加载Token信息失败:', error)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile()
      loadTokenInfo()
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supabase 认证系统测试
          </h1>
          <p className="text-gray-600">
            演示前端认证和后端JWT验证功能
          </p>
        </div>

        {!isAuthenticated ? (
          // 未登录状态 - 显示登录/注册表单
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md mb-4">
              <div className="flex border-b">
                <button
                  onClick={() => setCurrentView('login')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    currentView === 'login'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    currentView === 'register'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  注册
                </button>
              </div>
            </div>

            {currentView === 'login' ? (
              <LoginForm
                onSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setCurrentView('register')}
              />
            ) : (
              <RegisterForm
                onSuccess={handleAuthSuccess}
                onSwitchToLogin={() => setCurrentView('login')}
              />
            )}
          </div>
        ) : (
          // 已登录状态 - 显示用户信息
          <div className="space-y-6">
            {/* 用户信息卡片 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  用户信息
                </h2>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </button>
              </div>

              {isLoadingProfile ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">加载中...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 基本信息 */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">基本信息</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">用户ID:</span>
                        <p className="text-gray-600 break-all">{user?.id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">邮箱:</span>
                        <p className="text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* 用户资料 */}
                  {userProfile && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">用户资料</h3>
                      <div className="text-sm">
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{JSON.stringify(userProfile, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Token信息卡片 */}
            {tokenInfo && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  JWT Token 信息
                </h2>
                <div className="text-sm">
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
{JSON.stringify(tokenInfo, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 测试API按钮 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">API 测试</h2>
              <div className="space-y-2">
                <button
                  onClick={loadUserProfile}
                  className="mr-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  测试认证API
                </button>
                <button
                  onClick={loadTokenInfo}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  获取Token信息
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 