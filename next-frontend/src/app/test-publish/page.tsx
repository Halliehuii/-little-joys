'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestPublishPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('123456')
  const [content, setContent] = useState('这是一个测试帖子')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  // 创建Supabase客户端
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 登录函数
  const handleLogin = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setResult(`登录失败: ${error.message}`)
        return
      }

      if (data.session) {
        setToken(data.session.access_token)
        setIsLoggedIn(true)
        localStorage.setItem('access_token', data.session.access_token)
        setResult(`登录成功! Token: ${data.session.access_token.substring(0, 50)}...`)
      }
    } catch (error) {
      setResult(`登录错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 注册函数
  const handleRegister = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setResult(`注册失败: ${error.message}`)
        return
      }

      setResult('注册成功! 请检查邮箱确认后再登录')
    } catch (error) {
      setResult(`注册错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 发布测试
  const handlePublish = async () => {
    if (!token) {
      setResult('请先登录获取token')
      return
    }

    setLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          location: '测试地点',
          weather: '晴天 22°C'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(`发布成功! 帖子ID: ${data.data?.id || '未知'}`)
      } else {
        setResult(`发布失败: ${data.message || data.error || '未知错误'}`)
      }
    } catch (error) {
      setResult(`发布错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // 检查token状态
  const checkTokenStatus = () => {
    const storedToken = localStorage.getItem('access_token')
    if (storedToken) {
      setToken(storedToken)
      setIsLoggedIn(true)
      setResult(`找到已存储的token: ${storedToken.substring(0, 50)}...`)
    } else {
      setResult('未找到存储的token')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">发布功能测试</h1>
        
        {/* 认证部分 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">步骤1: 用户认证</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入邮箱"
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
                placeholder="输入密码"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '处理中...' : '登录'}
              </button>
              
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '处理中...' : '注册'}
              </button>
              
              <button
                onClick={checkTokenStatus}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                检查Token
              </button>
            </div>
          </div>
          
          {isLoggedIn && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
              ✅ 已登录，可以进行发布测试
            </div>
          )}
        </div>

        {/* 发布测试部分 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">步骤2: 发布测试</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                帖子内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="输入要发布的内容"
              />
            </div>
            
            <button
              onClick={handlePublish}
              disabled={loading || !isLoggedIn}
              className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50"
            >
              {loading ? '发布中...' : '发布帖子'}
            </button>
          </div>
        </div>

        {/* 结果显示 */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">执行结果</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 