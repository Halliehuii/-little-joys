'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { signOut } from '@/lib/auth';
import { getCurrentUserNickname } from '@/lib/user';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // 使用Zustand store获取认证状态
  const { user, isAuthenticated, clearUser } = useAuthStore();
  const [userNickname, setUserNickname] = useState<string>('用户');

  // 获取用户昵称
  useEffect(() => {
    const fetchUserNickname = async () => {
      if (isAuthenticated && user) {
        try {
          const nickname = await getCurrentUserNickname();
          setUserNickname(nickname);
        } catch (error) {
          console.error('获取用户昵称失败:', error);
          // 使用邮箱前缀作为后备
          setUserNickname(user.email?.split('@')[0] || '用户');
        }
      } else {
        setUserNickname('用户');
      }
    };

    fetchUserNickname();
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        clearUser();
        toast.success('退出登录成功！');
        router.push('/');
      } else {
        toast.error(result.error || '退出登录失败');
      }
    } catch (error) {
      console.error('退出登录错误:', error);
      toast.error('退出登录过程中发生错误');
    }
  };

  const isActivePath = (path: string) => pathname === path;

  return (
    <nav className="bg-gradient-to-r from-yellow-100 to-yellow-200 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo区域 */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl">📮</span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-800 group-hover:text-yellow-600 transition-colors">
                幸福小事日记
              </span>
            </div>
          </Link>

          {/* 桌面端导航菜单 */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath('/') 
                    ? 'bg-yellow-300 text-gray-800' 
                    : 'text-gray-700 hover:bg-yellow-200 hover:text-gray-800'
                }`}
              >
                🏠 主页
              </Link>
              
              <Link
                href="/search"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath('/search') 
                    ? 'bg-yellow-300 text-gray-800' 
                    : 'text-gray-700 hover:bg-yellow-200 hover:text-gray-800'
                }`}
              >
                🔍 搜索
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/upload"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/upload') 
                        ? 'bg-yellow-300 text-gray-800' 
                        : 'text-gray-700 hover:bg-yellow-200 hover:text-gray-800'
                    }`}
                  >
                    ✨ 写日记
                  </Link>
                  
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/profile') 
                        ? 'bg-yellow-300 text-gray-800' 
                        : 'text-gray-700 hover:bg-yellow-200 hover:text-gray-800'
                    }`}
                  >
                    👤 我的
                  </Link>
                  
                  {/* 用户昵称显示 */}
                  <span className="px-3 py-2 text-sm text-gray-600">
                    📧 {userNickname}
                  </span>
                  
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-red-200 hover:text-red-800 transition-colors"
                  >
                    🚪 退出
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActivePath('/login')
                      ? 'bg-pink-400 text-white'
                      : 'bg-pink-300 text-white hover:bg-pink-400 shadow-md hover:shadow-lg'
                  }`}
                >
                  💝 登录
                </Link>
              )}
            </div>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-800 hover:bg-yellow-200 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">打开主菜单</span>
              {showMobileMenu ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {showMobileMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-yellow-50 border-t border-yellow-200">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActivePath('/') 
                  ? 'bg-yellow-300 text-gray-800' 
                  : 'text-gray-700 hover:bg-yellow-200'
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              🏠 主页
            </Link>
            
            <Link
              href="/search"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActivePath('/search') 
                  ? 'bg-yellow-300 text-gray-800' 
                  : 'text-gray-700 hover:bg-yellow-200'
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              🔍 搜索
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/upload"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActivePath('/upload') 
                      ? 'bg-yellow-300 text-gray-800' 
                      : 'text-gray-700 hover:bg-yellow-200'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  ✨ 写日记
                </Link>
                
                <Link
                  href="/profile"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActivePath('/profile') 
                      ? 'bg-yellow-300 text-gray-800' 
                      : 'text-gray-700 hover:bg-yellow-200'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  👤 我的
                </Link>
                
                {/* 移动端用户昵称显示 */}
                <div className="px-3 py-2 text-sm text-gray-600">
                  📧 {userNickname}
                </div>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-red-200 hover:text-red-800 transition-colors"
                >
                  🚪 退出
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActivePath('/login')
                    ? 'bg-pink-400 text-white'
                    : 'bg-pink-300 text-white hover:bg-pink-400'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                💝 登录
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 