'use client'

import { useState, useEffect } from 'react'
import { getCurrentUserToken, debugAuthState, signIn } from '@/lib/auth'
import { apiRequest } from '@/lib/api'
import { createClient } from '@supabase/supabase-js'

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)

  // 创建Supabase客户端用于直接检查会话
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 获取认证状态信息
  const fetchAuthInfo = async () => {
    const token = getCurrentUserToken()
    const debugInfo = debugAuthState()
    
    // 检查Supabase的当前会话
    let supabaseSession = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      supabaseSession = session
    } catch (error) {
      console.error('获取Supabase会话失败:', error)
    }
    
    // 获取所有localStorage键值
    const allLocalStorageKeys = Object.keys(localStorage).map(key => ({
      key,
      value: localStorage.getItem(key)?.substring(0, 200) + (localStorage.getItem(key) && localStorage.getItem(key)!.length > 200 ? '...' : '') || ''
    }))
    
    setAuthInfo({
      token: token ? `${token.substring(0, 30)}...` : '无Token',
      fullToken: token,
      debugInfo,
      supabaseSession: supabaseSession ? {
        hasSession: true,
        accessToken: supabaseSession.access_token ? `${supabaseSession.access_token.substring(0, 30)}...` : '无',
        refreshToken: supabaseSession.refresh_token ? `${supabaseSession.refresh_token.substring(0, 30)}...` : '无',
        expiresAt: supabaseSession.expires_at ? new Date(supabaseSession.expires_at * 1000).toLocaleString() : '未知',
        user: {
          id: supabaseSession.user?.id,
          email: supabaseSession.user?.email
        }
      } : { hasSession: false },
      localStorage: Object.keys(localStorage).filter(key => 
        key.includes('auth') || key.includes('token') || key.includes('supabase') || key.includes('sb-')
      ).map(key => ({
        key,
        value: localStorage.getItem(key)?.substring(0, 100) + '...' || ''
      })),
      allLocalStorage: allLocalStorageKeys
    })
  }

  // 修复Token问题
  const fixTokenIssue = async () => {
    try {
      // 检查Supabase的当前会话
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && session.access_token) {
        // 如果Supabase有有效会话，同步到我们的存储
        localStorage.setItem('access_token', session.access_token)
        if (session.refresh_token) {
          localStorage.setItem('refresh_token', session.refresh_token)
        }
        if (session.user) {
          localStorage.setItem('user_info', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            nickname: session.user.user_metadata?.nickname
          }))
        }
        
        alert('✅ Token已修复！从Supabase会话同步到localStorage')
        fetchAuthInfo()
      } else {
        alert('❌ 没有找到有效的Supabase会话，请重新登录')
      }
    } catch (error) {
      alert(`修复失败: ${error}`)
    }
  }

  // 清理所有认证数据
  const clearAllAuth = () => {
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('token') || key.includes('supabase') || key.includes('sb-')
    )
    keys.forEach(key => localStorage.removeItem(key))
    
    // 同时登出Supabase
    supabase.auth.signOut()
    
    alert('🧹 所有认证数据已清理')
    fetchAuthInfo()
  }

  // 测试登录
  const handleTestLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      alert('请输入邮箱和密码')
      return
    }
    
    setLoginLoading(true)
    try {
      const result = await signIn(loginForm.email, loginForm.password)
      if (result.success) {
        alert('✅ 登录成功！')
        fetchAuthInfo()
      } else {
        alert(`❌ 登录失败: ${result.error}`)
      }
    } catch (error) {
      alert(`登录错误: ${error}`)
    } finally {
      setLoginLoading(false)
    }
  }

  // 测试认证API
  const testAuthAPI = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // 测试 /api/v1/auth/me
      console.log('🧪 测试 /api/v1/auth/me...')
      const meResult = await apiRequest.get('/api/v1/auth/me')
      results.authMe = { success: true, data: meResult }
    } catch (error: any) {
      results.authMe = { success: false, error: error.message, status: error.response?.status }
    }

    try {
      // 测试 /api/v1/auth/info
      console.log('🧪 测试 /api/v1/auth/info...')
      const infoResult = await apiRequest.get('/api/v1/auth/info')
      results.authInfo = { success: true, data: infoResult }
    } catch (error: any) {
      results.authInfo = { success: false, error: error.message, status: error.response?.status }
    }

    try {
      // 测试 /api/v1/posts（创建便签）
      console.log('🧪 测试创建便签...')
      const postResult = await apiRequest.post('/api/v1/posts', {
        content: '这是一个测试便签 - ' + new Date().toLocaleString()
      })
      results.createPost = { success: true, data: postResult }
    } catch (error: any) {
      results.createPost = { success: false, error: error.message, status: error.response?.status }
    }

    setTestResults(results)
    setLoading(false)
  }

  useEffect(() => {
    fetchAuthInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🔍 认证调试页面</h1>
        
        {/* 快速操作 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🚀 快速操作</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={fetchAuthInfo}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              🔄 刷新状态
            </button>
            <button
              onClick={fixTokenIssue}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              🔧 修复Token
            </button>
            <button
              onClick={clearAllAuth}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              🧹 清理认证
            </button>
          </div>
        </div>

        {/* 测试登录 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔐 测试登录</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="邮箱"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <input
              type="password"
              placeholder="密码"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={handleTestLogin}
              disabled={loginLoading}
              className={`px-4 py-2 rounded text-white ${
                loginLoading ? 'bg-gray-400' : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {loginLoading ? '登录中...' : '🔑 测试登录'}
            </button>
          </div>
        </div>
        
        {/* 认证状态信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 认证状态信息</h2>
          
          {authInfo && (
            <div className="space-y-6">
              {/* Token状态 */}
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">🎫 Token状态:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Token预览:</strong> {authInfo.token}</p>
                  <p><strong>有Token:</strong> {authInfo.debugInfo.hasToken ? '✅' : '❌'}</p>
                  <p><strong>Token有效:</strong> {authInfo.debugInfo.tokenValid ? '✅' : '❌'}</p>
                  <p><strong>已认证:</strong> {authInfo.debugInfo.isAuthenticated ? '✅' : '❌'}</p>
                </div>
              </div>

              {/* Supabase会话状态 */}
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold mb-2">🔵 Supabase会话状态:</h3>
                <div className="text-sm">
                  <p><strong>有会话:</strong> {authInfo.supabaseSession.hasSession ? '✅' : '❌'}</p>
                  {authInfo.supabaseSession.hasSession && (
                    <div className="mt-2 space-y-1">
                      <p><strong>Access Token:</strong> {authInfo.supabaseSession.accessToken}</p>
                      <p><strong>Refresh Token:</strong> {authInfo.supabaseSession.refreshToken}</p>
                      <p><strong>过期时间:</strong> {authInfo.supabaseSession.expiresAt}</p>
                      <p><strong>用户ID:</strong> {authInfo.supabaseSession.user.id}</p>
                      <p><strong>邮箱:</strong> {authInfo.supabaseSession.user.email}</p>
                    </div>
                  )}
                </div>
              </div>
                
              {/* 认证相关的LocalStorage */}
              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-semibold mb-2">🗄️ 认证相关存储:</h3>
                <div className="space-y-1 text-xs">
                  {authInfo.localStorage.map((item: any, index: number) => (
                    <div key={index} className="break-all">
                      <strong className="text-blue-600">{item.key}:</strong> 
                      <span className="ml-2 text-gray-600">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {authInfo.fullToken && (
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">🔑 完整Token（用于调试）:</h3>
                  <textarea
                    className="w-full h-24 text-xs bg-white border rounded p-2 font-mono"
                    value={authInfo.fullToken}
                    readOnly
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* API测试 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 API测试</h2>
          <div className="space-y-4">
            <button
              onClick={testAuthAPI}
              disabled={loading}
              className={`px-6 py-3 rounded text-white font-medium ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {loading ? '测试中...' : '🚀 运行API测试'}
            </button>

            {Object.keys(testResults).length > 0 && (
              <div className="space-y-4">
                {Object.entries(testResults).map(([key, result]: [string, any]) => (
                  <div key={key} className="border rounded p-4">
                    <h3 className="font-semibold mb-2">
                      {key === 'authMe' && '🔐 认证测试 (/api/v1/auth/me)'}
                      {key === 'authInfo' && '📋 Token信息 (/api/v1/auth/info)'}
                      {key === 'createPost' && '📝 创建便签 (/api/v1/posts)'}
                    </h3>
                    <div className={`p-3 rounded text-sm ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? (
                        <div>
                          <p className="font-semibold">✅ 成功</p>
                          <pre className="mt-2 overflow-auto text-xs">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold">❌ 失败</p>
                          <p><strong>状态码:</strong> {result.status || '未知'}</p>
                          <p><strong>错误信息:</strong> {result.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 所有LocalStorage内容（折叠） */}
        <details className="bg-white rounded-lg shadow-md p-6">
          <summary className="text-xl font-semibold cursor-pointer">📦 所有LocalStorage内容</summary>
          <div className="mt-4 space-y-2 text-xs">
            {authInfo?.allLocalStorage?.map((item: any, index: number) => (
              <div key={index} className="border-b pb-2 break-all">
                <strong className="text-purple-600">{item.key}:</strong>
                <div className="ml-4 text-gray-600 font-mono">{item.value}</div>
              </div>
            ))}
          </div>
        </details>

        {/* 返回首页 */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-block bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600"
          >
            🏠 返回首页
          </a>
        </div>
      </div>
    </div>
  )
} 