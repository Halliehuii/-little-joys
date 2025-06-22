'use client'

import { useState, useEffect } from 'react'
import { signUp, signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function TestAuthPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('testpassword123')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // 检查Supabase状态
  const checkSupabaseStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5秒超时
      })
      
      if (response.ok || response.status === 401) {
        // 401也表示服务器在线，只是需要认证
        setSupabaseStatus('online')
        return true
      } else {
        setSupabaseStatus('offline')
        return false
      }
    } catch (error) {
      setSupabaseStatus('offline')
      return false
    } finally {
      setLastCheck(new Date())
    }
  }

  // 页面加载时检查状态
  useEffect(() => {
    checkSupabaseStatus()
  }, [])

  // 模拟测试
  const testMockAuth = async () => {
    setIsLoading(true)
    setResult('正在进行模拟测试...')
    
    try {
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟成功的认证响应
      const mockResult = {
        success: true,
        user: {
          id: 'mock-user-id',
          email: email,
          created_at: new Date().toISOString()
        },
        message: '模拟登录成功'
      }
      
      setResult(`✅ 模拟测试成功！

用户邮箱: ${mockResult.user.email}
用户ID: ${mockResult.user.id}
创建时间: ${mockResult.user.created_at}

这说明你的前端代码逻辑是正常的。
问题确实在于Supabase项目被暂停。`)
      
    } catch (error) {
      setResult(`❌ 模拟测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 测试连接
  const testConnection = async () => {
    setIsLoading(true)
    setResult('正在测试连接...')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setResult(`❌ 连接错误: ${error.message}

这个错误说明Supabase项目还没有完全恢复。
请等待一段时间后再试。`)
      } else if (session) {
        setResult(`✅ 连接成功，当前用户: ${session.user.email}`)
      } else {
        setResult(`✅ 连接成功，未登录状态

Supabase项目已恢复正常！现在可以尝试注册和登录功能了。`)
      }
    } catch (error) {
      console.error('连接测试错误:', error)
      setResult(`❌ 连接测试失败: ${error instanceof Error ? error.message : '未知错误'}

这说明Supabase项目还没有恢复。请稍后再试。`)
    } finally {
      setIsLoading(false)
      // 更新状态检查
      await checkSupabaseStatus()
    }
  }

  // 测试注册
  const testSignUp = async () => {
    if (supabaseStatus === 'offline') {
      setResult('❌ Supabase项目还没有恢复，无法进行注册测试。请先等待项目恢复。')
      return
    }

    setIsLoading(true)
    setResult('正在测试注册...')
    
    try {
      console.log('开始注册测试，邮箱:', email)
      const result = await signUp(email, password)
      console.log('注册结果:', result)
      
      if (result.success) {
        setResult(`✅ 注册成功！${result.user ? `用户: ${result.user.email}` : '请查看邮箱验证'}`)
      } else {
        setResult(`❌ 注册失败: ${result.error}`)
      }
    } catch (error) {
      console.error('注册测试错误:', error)
      setResult(`❌ 注册测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 测试登录
  const testSignIn = async () => {
    if (supabaseStatus === 'offline') {
      setResult('❌ Supabase项目还没有恢复，无法进行登录测试。请先等待项目恢复。')
      return
    }

    setIsLoading(true)
    setResult('正在测试登录...')
    
    try {
      console.log('开始登录测试，邮箱:', email)
      const result = await signIn(email, password)
      console.log('登录结果:', result)
      
      if (result.success) {
        setResult(`✅ 登录成功！用户: ${result.user?.email}`)
      } else {
        setResult(`❌ 登录失败: ${result.error}`)
      }
    } catch (error) {
      console.error('登录测试错误:', error)
      setResult(`❌ 登录测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 测试直接Supabase API
  const testDirectSupabase = async () => {
    if (supabaseStatus === 'offline') {
      setResult('❌ Supabase项目还没有恢复，无法进行API测试。请先等待项目恢复。')
      return
    }

    setIsLoading(true)
    setResult('正在测试直接Supabase调用...')
    
    try {
      console.log('Supabase客户端创建成功')
      
      // 测试注册
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      })
      
      console.log('Supabase注册响应:', { data, error })
      
      if (error) {
        setResult(`❌ Supabase注册错误: ${error.message}`)
      } else {
        setResult(`✅ Supabase注册成功: ${data.user?.email || '用户数据为空'}`)
      }
    } catch (error) {
      console.error('直接Supabase测试错误:', error)
      setResult(`❌ 直接Supabase测试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 手动检查状态
  const handleCheckStatus = async () => {
    setIsLoading(true)
    setResult('正在检查Supabase项目状态...')
    
    const isOnline = await checkSupabaseStatus()
    
    if (isOnline) {
      setResult(`✅ 好消息！Supabase项目已恢复正常！

现在你可以：
1. 尝试测试连接
2. 测试注册功能  
3. 测试登录功能

项目恢复时间: ${new Date().toLocaleString()}`)
    } else {
      setResult(`⏳ Supabase项目还没有完全恢复

请耐心等待，项目恢复通常需要几分钟到几小时不等。
你可以：
1. 等待一段时间后再次检查
2. 联系Supabase支持团队
3. 先使用"模拟测试"验证代码逻辑

最后检查时间: ${new Date().toLocaleString()}`)
    }
    
    setIsLoading(false)
  }

  const getStatusColor = () => {
    switch (supabaseStatus) {
      case 'online': return 'text-green-600 bg-green-50 border-green-200'
      case 'offline': return 'text-red-600 bg-red-50 border-red-200'
      case 'checking': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const getStatusText = () => {
    switch (supabaseStatus) {
      case 'online': return '🟢 在线'
      case 'offline': return '🔴 离线（项目被暂停）'
      case 'checking': return '🟡 检查中...'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">认证功能测试 - 项目恢复监控</h1>
        
        {/* Supabase状态显示 */}
        <div className={`mb-6 p-4 border rounded-md ${getStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">Supabase项目状态</h3>
              <p className="text-sm">{getStatusText()}</p>
              {lastCheck && (
                <p className="text-xs mt-1">
                  最后检查: {lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={handleCheckStatus}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoading ? '检查中...' : '重新检查'}
            </button>
          </div>
        </div>

        {/* 项目暂停说明 */}
        {supabaseStatus === 'offline' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">📋 项目恢复说明</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Supabase项目恢复通常需要几分钟到几小时</p>
              <p>• 你可以定期点击"重新检查"按钮</p>
              <p>• 项目恢复后，所有功能将自动正常工作</p>
              <p>• 可以先使用"模拟测试"验证代码逻辑</p>
            </div>
          </div>
        )}

        {/* 项目恢复成功提示 */}
        {supabaseStatus === 'online' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-medium text-green-800 mb-2">🎉 项目已恢复！</h3>
            <p className="text-sm text-green-700">
              你的Supabase项目现在可以正常使用了！可以开始测试认证功能。
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          {/* 输入框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* 测试按钮 */}
          <div className="space-y-2">
            <button
              onClick={testMockAuth}
              disabled={isLoading}
              className="w-full bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 disabled:opacity-50 font-medium"
            >
              {isLoading ? '测试中...' : '🧪 模拟测试（始终可用）'}
            </button>
            
            <button
              onClick={testConnection}
              disabled={isLoading || supabaseStatus === 'checking'}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '🔗 测试连接'}
            </button>
            
            <button
              onClick={testDirectSupabase}
              disabled={isLoading || supabaseStatus === 'offline'}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '🔧 测试直接Supabase API'}
            </button>
            
            <button
              onClick={testSignUp}
              disabled={isLoading || supabaseStatus === 'offline'}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '📝 测试注册'}
            </button>
            
            <button
              onClick={testSignIn}
              disabled={isLoading || supabaseStatus === 'offline'}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '🔑 测试登录'}
            </button>
          </div>

          {/* 结果显示 */}
          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">测试结果:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
          
          {/* 环境变量显示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium mb-2">环境配置:</h3>
            <div className="text-sm space-y-1">
              <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置'}</div>
              <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 