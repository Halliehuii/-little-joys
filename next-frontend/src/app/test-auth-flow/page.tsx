'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, XCircle, Mail, User, Database } from 'lucide-react'

export default function TestAuthFlowPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('test@example.com')

  const runFullTest = async () => {
    setIsLoading(true)
    setTestResults(null)

    const results = {
      step1_environment: null as any,
      step2_supabase_connection: null as any,
      step3_register_attempt: null as any,
      step4_auth_urls: null as any,
      summary: {
        success: false,
        message: '',
        nextSteps: [] as string[]
      }
    }

    try {
      // 步骤1: 检查环境配置
      console.log('步骤1: 检查环境配置...')
      const envResponse = await fetch('/api/debug-env')
      const envData = await envResponse.json()
      results.step1_environment = envData

      // 步骤2: 测试Supabase连接
      console.log('步骤2: 测试Supabase连接...')
      const connectionResponse = await fetch('/api/diagnose-supabase')
      const connectionData = await connectionResponse.json()
      results.step2_supabase_connection = connectionData

      // 步骤3: 尝试注册测试用户
      console.log('步骤3: 尝试注册测试用户...')
      const registerResponse = await fetch('/api/test-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'TestPassword123!'
        })
      })
      const registerData = await registerResponse.json()
      results.step3_register_attempt = registerData

      // 步骤4: 检查认证URLs
      console.log('步骤4: 检查认证URLs...')
      const currentUrl = window.location.origin
      results.step4_auth_urls = {
        site_url: currentUrl,
        callback_url: `${currentUrl}/auth/callback`,
        confirmation_url: `${currentUrl}/auth/confirmed`,
        error_url: `${currentUrl}/auth/error`,
        login_url: `${currentUrl}/login`
      }

      // 生成测试总结
      const hasEnvironment = envData.success && envData.environment.hasUrl && envData.environment.hasAnonKey
      const hasConnection = connectionData.success
      const canRegister = registerData.success || registerData.message?.includes('已存在')

      if (hasEnvironment && hasConnection && canRegister) {
        results.summary = {
          success: true,
          message: '认证流程配置正确！可以进行邮箱确认测试。',
          nextSteps: [
            '1. 注册一个新的邮箱账户',
            '2. 检查邮箱中的确认邮件',
            '3. 点击邮件中的确认链接',
            '4. 确认是否正确跳转到确认成功页面',
            '5. 尝试使用确认后的账户登录'
          ]
        }
      } else {
        results.summary = {
          success: false,
          message: '认证流程配置存在问题',
          nextSteps: [
            !hasEnvironment && '检查环境变量配置',
            !hasConnection && '检查Supabase项目状态',
            !canRegister && '检查用户注册功能'
          ].filter(Boolean) as string[]
        }
      }

    } catch (error) {
      console.error('测试过程中发生错误:', error)
      results.summary = {
        success: false,
        message: '测试过程中发生错误: ' + (error instanceof Error ? error.message : '未知错误'),
        nextSteps: ['检查网络连接', '查看控制台错误信息', '联系技术支持']
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
            邮箱认证流程测试
          </h1>
          <p className="text-gray-600">
            测试完整的邮箱注册和确认流程
          </p>
        </div>

        {/* 测试控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            测试控制面板
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-2">
                测试邮箱地址
              </label>
              <input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入用于测试的邮箱地址"
              />
            </div>

            <button
              onClick={runFullTest}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium"
            >
              {isLoading ? '测试中...' : '开始完整测试'}
            </button>
          </div>
        </div>

        {/* 测试结果 */}
        {testResults && (
          <div className="space-y-6">
            {/* 环境配置检查 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <StatusIcon success={testResults.step1_environment?.success} />
                <span className="ml-2">步骤1: 环境配置检查</span>
              </h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResults.step1_environment, null, 2)}
              </pre>
            </div>

            {/* Supabase连接测试 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <StatusIcon success={testResults.step2_supabase_connection?.success} />
                <span className="ml-2">步骤2: Supabase连接测试</span>
              </h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResults.step2_supabase_connection, null, 2)}
              </pre>
            </div>

            {/* 用户注册测试 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <StatusIcon success={testResults.step3_register_attempt?.success} />
                <span className="ml-2">步骤3: 用户注册测试</span>
              </h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResults.step3_register_attempt, null, 2)}
              </pre>
            </div>

            {/* 认证URLs配置 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="ml-2">步骤4: 认证URLs配置</span>
              </h3>
              <div className="space-y-2 text-sm">
                {Object.entries(testResults.step4_auth_urls).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-blue-600">{value as string}</span>
                  </div>
                ))}
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
              
              <p className={`mb-4 ${testResults.summary.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResults.summary.message}
              </p>

              {testResults.summary.nextSteps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">下一步操作:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {testResults.summary.nextSteps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
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
            <li>运行上面的自动测试，确保所有步骤都通过</li>
            <li>访问登录页面 <a href="/login" className="text-blue-600 underline">点击这里</a></li>
            <li>切换到"邮箱注册"标签</li>
            <li>使用一个真实的邮箱地址注册新账户</li>
            <li>检查邮箱中的确认邮件</li>
            <li>点击邮件中的"Confirm your mail"链接</li>
            <li>确认是否正确跳转到确认成功页面</li>
            <li>返回登录页面，使用注册的邮箱和密码登录</li>
            <li>确认登录成功</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 