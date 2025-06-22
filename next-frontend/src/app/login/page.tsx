'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuthStore } from '@/lib/store/auth';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [urlMessage, setUrlMessage] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
  } | null>(null);

  // 处理URL参数中的消息
  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    
    if (message) {
      setUrlMessage({
        type: 'info',
        message: message
      });
    } else if (error) {
      setUrlMessage({
        type: 'error',
        message: '邮箱确认失败，请重新尝试注册'
      });
    }
  }, [searchParams]);

  // 处理认证成功
  const handleAuthSuccess = () => {
    toast.success('欢迎来到小确幸日记！');
    // 跳转到首页
    router.push('/');
  };

  // 如果已经登录，直接跳转到首页
  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📮</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            小确幸日记
          </h1>
          <p className="text-gray-600">
            记录生活中的美好瞬间
          </p>
        </div>

        {/* URL消息提示 */}
        {urlMessage && (
          <div className={`mb-6 p-4 rounded-xl border ${
            urlMessage.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : urlMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center space-x-2">
              {urlMessage.type === 'error' ? (
                <AlertCircle className="h-5 w-5" />
              ) : urlMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
              <p className="text-sm font-medium">
                {urlMessage.message}
              </p>
            </div>
          </div>
        )}

        {/* 登录/注册卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 登录方式切换 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setCurrentView('login')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                currentView === 'login'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📧 邮箱登录
            </button>
            <button
              onClick={() => setCurrentView('register')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                currentView === 'register'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🎯 邮箱注册
            </button>
          </div>

          {/* 表单区域 */}
          <div className="space-y-6">
            {currentView === 'login' ? (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                    <span className="text-2xl text-blue-600">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    邮箱登录
                  </h3>
                  <p className="text-gray-600 text-sm">
                    使用邮箱和密码登录您的账户
                  </p>
                </div>
                
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setCurrentView('register')}
                />
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                    <span className="text-2xl text-green-600">🎯</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    创建账户
                  </h3>
                  <p className="text-gray-600 text-sm">
                    注册新账户，开始记录您的美好时光
                  </p>
                </div>

                <RegisterForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToLogin={() => setCurrentView('login')}
                />
              </div>
            )}

            {/* 用户协议 */}
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                {currentView === 'register' ? '注册' : '登录'}即表示同意
                <Link href="/terms" className="text-blue-500 hover:underline mx-1">
                  用户协议
                </Link>
                和
                <Link href="/privacy" className="text-blue-500 hover:underline mx-1">
                  隐私政策
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* 底部链接 */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            ← 返回首页
          </Link>
        </div>

        {/* 装饰元素 */}
        <div className="fixed top-10 left-10 text-4xl opacity-20 animate-bounce">
          ✨
        </div>
        <div className="fixed top-20 right-20 text-3xl opacity-20 animate-pulse">
          🌸
        </div>
        <div className="fixed bottom-20 left-20 text-3xl opacity-20 animate-bounce delay-500">
          🌟
        </div>
        <div className="fixed bottom-10 right-10 text-4xl opacity-20 animate-pulse delay-1000">
          💕
        </div>
      </div>
    </div>
  );
} 