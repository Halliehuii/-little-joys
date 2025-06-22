'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Database, FileText, User } from 'lucide-react'

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export default function TestPostFlowPage() {
  const [testResults, setTestResults] = useState<{
    step1_checkAuth: TestResult | null
    step2_createPost: TestResult | null
    step3_fetchPosts: TestResult | null
    step4_checkBackend: TestResult | null
    summary: {
      success: boolean
      message: string
      nextSteps: string[]
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runPostFlowTest = async () => {
    setIsLoading(true)
    setTestResults(null)

    const results = {
      step1_checkAuth: null as TestResult | null,
      step2_createPost: null as TestResult | null,
      step3_fetchPosts: null as TestResult | null,
      step4_checkBackend: null as TestResult | null,
      summary: {
        success: false,
        message: '',
        nextSteps: [] as string[]
      }
    }

    try {
      // 步骤1: 检查认证状态
      console.log('步骤1: 检查认证状态...')
      const token = localStorage.getItem('access_token')
      if (token) {
        results.step1_checkAuth = {
          success: true,
          message: '找到认证token',
          data: { hasToken: true, tokenLength: token.length }
        }
      } else {
        results.step1_checkAuth = {
          success: false,
          message: '未找到认证token，需要先登录',
          error: 'NO_TOKEN'
        }
      }

      // 步骤2: 尝试创建测试帖子
      console.log('步骤2: 测试创建帖子...')
      if (token) {
        try {
          const createResponse = await fetch('/api/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              content: `这是一个测试帖子 - ${new Date().toLocaleString()}`,
              location: '测试地点',
              weather: '测试天气 20°C'
            })
          })

          const createResult = await createResponse.json()
          
          if (createResponse.ok && createResult.success) {
            results.step2_createPost = {
              success: true,
              message: '帖子创建成功',
              data: createResult.data
            }
          } else {
            results.step2_createPost = {
              success: false,
              message: '帖子创建失败',
              error: createResult.message || createResult.error || '未知错误'
            }
          }
        } catch (error) {
          results.step2_createPost = {
            success: false,
            message: '帖子创建请求失败',
            error: error instanceof Error ? error.message : '网络错误'
          }
        }
      } else {
        results.step2_createPost = {
          success: false,
          message: '跳过帖子创建，未登录',
          error: 'NO_TOKEN'
        }
      }

      // 步骤3: 测试获取帖子列表
      console.log('步骤3: 测试获取帖子列表...')
      try {
        const fetchResponse = await fetch('/api/posts?page=1&limit=10')
        const fetchResult = await fetchResponse.json()
        
        if (fetchResponse.ok && fetchResult.success) {
          results.step3_fetchPosts = {
            success: true,
            message: `成功获取${fetchResult.data?.posts?.length || 0}个帖子`,
            data: {
              postsCount: fetchResult.data?.posts?.length || 0,
              pagination: fetchResult.data?.pagination
            }
          }
        } else {
          results.step3_fetchPosts = {
            success: false,
            message: '获取帖子列表失败',
            error: fetchResult.message || fetchResult.error || '未知错误'
          }
        }
      } catch (error) {
        results.step3_fetchPosts = {
          success: false,
          message: '获取帖子列表请求失败',
          error: error instanceof Error ? error.message : '网络错误'
        }
      }

      // 步骤4: 检查后端连接
      console.log('步骤4: 检查后端连接...')
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const backendResponse = await fetch(`${backendUrl}/health`)
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json()
          results.step4_checkBackend = {
            success: true,
            message: '后端服务正常',
            data: backendData
          }
        } else {
          results.step4_checkBackend = {
            success: false,
            message: `后端服务响应错误: ${backendResponse.status}`,
            error: `HTTP_${backendResponse.status}`
          }
        }
      } catch (error) {
        results.step4_checkBackend = {
          success: false,
          message: '无法连接到后端服务',
          error: error instanceof Error ? error.message : '连接失败'
        }
      }

      // 生成测试总结
      const hasAuth = results.step1_checkAuth?.success
      const canCreatePost = results.step2_createPost?.success
      const canFetchPosts = results.step3_fetchPosts?.success
      const backendOk = results.step4_checkBackend?.success

      if (hasAuth && canCreatePost && canFetchPosts && backendOk) {
        results.summary = {
          success: true,
          message: '帖子发布流程完全正常！✅',
          nextSteps: [
            '✅ 认证系统正常工作',
            '✅ 帖子创建功能正常',
            '✅ 帖子获取功能正常',
            '✅ 后端服务连接正常',
            '🎉 可以正常发布和查看内容了'
          ]
        }
      } else {
        const issues: string[] = []
        if (!hasAuth) issues.push('需要先登录')
        if (!backendOk) issues.push('后端服务需要启动')
        if (!canCreatePost) issues.push('帖子创建功能有问题')
        if (!canFetchPosts) issues.push('帖子获取功能有问题')

        results.summary = {
          success: false,
          message: '帖子发布流程存在问题',
          nextSteps: [
            ...issues.map(issue => `❌ ${issue}`),
            '',
            '🔧 解决建议:',
            !hasAuth && '1. 请先到登录页面登录',
            !backendOk && '2. 启动FastAPI后端服务 (python main.py)',
            (!canCreatePost || !canFetchPosts) && '3. 检查API路由和数据库连接',
            '4. 确认Supabase配置正确'
          ].filter(Boolean) as string[]
        }
      }

    } catch (error) {
      console.error('测试流程异常:', error)
      results.summary = {
        success: false,
        message: '测试过程中发生异常',
        nextSteps: [
          '❌ 测试流程执行失败',
          '🔧 请检查网络连接和服务状态'
        ]
      }
    }

    setTestResults(results)
    setIsLoading(false)
  }

  const StatusIcon = ({ success }: { success: boolean }) => (
    success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📝 帖子发布流程测试
          </h1>
          <p className="text-gray-600">
            测试内容发布和数据库存储的完整流程
          </p>
        </div>

        {/* 测试控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            流程测试控制台
          </h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">测试内容</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 检查用户认证状态</li>
                <li>• 测试创建新帖子</li>
                <li>• 测试获取帖子列表</li>
                <li>• 验证后端服务连接</li>
              </ul>
            </div>

            <button
              onClick={runPostFlowTest}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium"
            >
              {isLoading ? '测试中...' : '开始流程测试'}
            </button>
          </div>
        </div>

        {/* 测试结果 */}
        {testResults && (
          <div className="space-y-6">
            {/* 认证检查 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <StatusIcon success={testResults.step1_checkAuth?.success || false} />
                <span className="ml-2">步骤1: 认证状态检查</span>
              </h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <div className="space-y-2">
                  <p><strong>状态:</strong> {testResults.step1_checkAuth?.success ? '✅ 已登录' : '❌ 未登录'}</p>
                  <p><strong>消息:</strong> {testResults.step1_checkAuth?.message}</p>
                  {testResults.step1_checkAuth?.data && (
                    <p><strong>Token长度:</strong> {testResults.step1_checkAuth.data.tokenLength}</p>
                  )}
                  {testResults.step1_checkAuth?.error && (
                    <p><strong>错误:</strong> {testResults.step1_checkAuth.error}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 创建帖子测试 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <StatusIcon success={testResults.step2_createPost?.success || false} />
                <span className="ml-2">步骤2: 创建帖子测试</span>
              </h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <div className="space-y-2">
                  <p><strong>状态:</strong> {testResults.step2_createPost?.success ? '✅ 成功' : '❌ 失败'}</p>
                  <p><strong>消息:</strong> {testResults.step2_createPost?.message}</p>
                  {testResults.step2_createPost?.error && (
                    <p><strong>错误:</strong> {testResults.step2_createPost.error}</p>
                  )}
                  {testResults.step2_createPost?.data && (
                    <pre className="mt-2 overflow-auto">
                      {JSON.stringify(testResults.step2_createPost.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* 获取帖子测试 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <StatusIcon success={testResults.step3_fetchPosts?.success || false} />
                <span className="ml-2">步骤3: 获取帖子列表测试</span>
              </h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <div className="space-y-2">
                  <p><strong>状态:</strong> {testResults.step3_fetchPosts?.success ? '✅ 成功' : '❌ 失败'}</p>
                  <p><strong>消息:</strong> {testResults.step3_fetchPosts?.message}</p>
                  {testResults.step3_fetchPosts?.data && (
                    <p><strong>帖子数量:</strong> {testResults.step3_fetchPosts.data.postsCount}</p>
                  )}
                  {testResults.step3_fetchPosts?.error && (
                    <p><strong>错误:</strong> {testResults.step3_fetchPosts.error}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 后端连接测试 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <StatusIcon success={testResults.step4_checkBackend?.success || false} />
                <span className="ml-2">步骤4: 后端服务检查</span>
              </h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <div className="space-y-2">
                  <p><strong>状态:</strong> {testResults.step4_checkBackend?.success ? '✅ 正常' : '❌ 异常'}</p>
                  <p><strong>消息:</strong> {testResults.step4_checkBackend?.message}</p>
                  {testResults.step4_checkBackend?.error && (
                    <p><strong>错误:</strong> {testResults.step4_checkBackend.error}</p>
                  )}
                  {testResults.step4_checkBackend?.data && (
                    <pre className="mt-2 overflow-auto">
                      {JSON.stringify(testResults.step4_checkBackend.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* 测试总结 */}
            <div className={`rounded-lg shadow-md p-6 ${
              testResults.summary.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <StatusIcon success={testResults.summary.success} />
                <span className="ml-2">测试总结</span>
              </h3>
              
              <p className={`mb-4 font-medium ${testResults.summary.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResults.summary.message}
              </p>

              {testResults.summary.nextSteps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">详细说明:</h4>
                  <ul className="space-y-1 text-sm">
                    {testResults.summary.nextSteps.map((step: string, index: number) => (
                      <li key={index} className={step === '' ? 'h-2' : ''}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 手动测试说明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            🧪 手动测试步骤
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700 text-sm">
            <li>确保后端服务正在运行 (FastAPI在8000端口)</li>
            <li>确保已经登录账户 <a href="/login" className="text-blue-600 underline">点击登录</a></li>
            <li>运行上面的自动测试，确保所有步骤都通过</li>
            <li>访问上传页面 <a href="/upload" className="text-blue-600 underline">点击上传</a></li>
            <li>创建一个测试帖子并发布</li>
            <li>返回首页 <a href="/" className="text-blue-600 underline">点击首页</a> 查看新内容</li>
            <li>访问个人主页 <a href="/profile" className="text-blue-600 underline">点击个人主页</a> 查看个人内容</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 