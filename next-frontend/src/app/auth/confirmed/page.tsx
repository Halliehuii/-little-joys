'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Mail } from 'lucide-react'

export default function EmailConfirmedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // 获取邮箱地址
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }

    // 5秒后自动跳转到登录页面
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 成功图标和动画 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            邮箱验证成功！
          </h1>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Mail className="h-5 w-5" />
            <p className="text-sm">
              {email ? `${email} 已成功验证` : '您的邮箱已成功验证'}
            </p>
          </div>
        </div>

        {/* 成功卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="space-y-4">
            <div className="text-5xl mb-4">🎉</div>
            
            <h2 className="text-xl font-semibold text-gray-800">
              欢迎加入小确幸日记！
            </h2>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              您的账号已经成功激活，现在可以登录并开始记录生活中的美好瞬间了。
            </p>

            {/* 自动跳转提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
              <p className="text-blue-800 text-sm">
                <span className="font-medium">{countdown}</span> 秒后将自动跳转到登录页面
              </p>
            </div>

            {/* 立即登录按钮 */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl space-x-2 text-lg font-medium"
            >
              <Mail className="h-5 w-5" />
              <span>立即登录</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            {/* 返回首页选项 */}
            <Link
              href="/"
              className="inline-block text-gray-600 hover:text-gray-800 text-sm font-medium mt-4 transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>

        {/* 小贴士 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            💡 小贴士
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 请使用注册时的邮箱和密码登录</li>
            <li>• 首次登录后建议完善个人资料</li>
            <li>• 开始记录您的第一篇小确幸日记吧！</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 