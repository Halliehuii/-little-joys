'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Mail, RefreshCw } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    setError(searchParams.get('error') || 'unknown_error')
    setDescription(searchParams.get('description') || '发生了未知错误')
  }, [searchParams])

  // 错误类型处理
  const getErrorInfo = (errorType: string) => {
    switch (errorType) {
      case 'access_denied':
        return {
          title: '访问被拒绝',
          message: '邮箱确认被取消或拒绝',
          suggestions: ['重新尝试注册', '检查邮箱地址是否正确', '联系客服获取帮助']
        }
      case 'expired_token':
        return {
          title: '确认链接已过期',
          message: '邮箱确认链接已过期，请重新注册',
          suggestions: ['重新注册账号', '确认链接有效期为24小时', '注册后请及时点击确认链接']
        }
      case 'invalid_request':
        return {
          title: '无效的确认请求',
          message: '确认链接格式不正确或已被使用',
          suggestions: ['重新注册账号', '确保完整复制确认链接', '避免重复点击确认链接']
        }
      case 'exchange_failed':
        return {
          title: '邮箱确认失败',
          message: '无法处理邮箱确认请求',
          suggestions: ['检查网络连接', '重新尝试确认', '联系技术支持']
        }
      case 'no_session':
        return {
          title: '会话创建失败',
          message: '邮箱确认成功但无法创建登录会话',
          suggestions: ['直接尝试登录', '清除浏览器缓存后重试', '联系技术支持']
        }
      default:
        return {
          title: '邮箱确认出错',
          message: '处理邮箱确认时发生了问题',
          suggestions: ['重新尝试', '检查确认链接是否完整', '联系客服获取帮助']
        }
    }
  }

  const errorInfo = getErrorInfo(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 错误图标 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 text-sm">
            邮箱确认过程中遇到了问题
          </p>
        </div>

        {/* 错误详情卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            {/* 错误信息 */}
            <div className="text-center">
              <div className="text-4xl mb-4">😔</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {errorInfo.message}
              </h2>
              <p className="text-gray-600 text-sm">
                {description}
              </p>
            </div>

            {/* 解决建议 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                解决建议
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl space-x-2 text-lg font-medium"
              >
                <Mail className="h-5 w-5" />
                <span>重新注册</span>
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center w-full py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all space-x-2 font-medium"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>返回首页</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 技术详情（调试用） */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              技术详情（点击展开）
            </summary>
            <div className="mt-2 text-gray-600 space-y-1">
              <p><strong>错误代码：</strong> {error}</p>
              <p><strong>错误描述：</strong> {description}</p>
              <p><strong>时间：</strong> {new Date().toLocaleString()}</p>
            </div>
          </details>
        </div>

        {/* 联系客服 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            如果问题持续存在，请
            <a 
              href="mailto:support@littlejoys.com" 
              className="font-medium text-blue-600 hover:text-blue-500 ml-1"
            >
              联系客服
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 