'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import { useAuthStore } from '@/lib/store/auth';
import { signOut } from '@/lib/auth';
import toast from 'react-hot-toast';

interface UserInfo {
  id: string;
  nickname: string;
  avatar_url?: string;
  phone?: string;
  wechat_openid?: string;
  bio?: string;
  location?: string;
  created_at: string;
}

interface UserStats {
  postsCount: number;
  likesReceived: number;
  rewardsReceived: number;
  commentsReceived: number;
}

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  rewards_count: number;
  user: {
    nickname: string;
    avatar_url?: string;
  };
  location_data?: {
    name: string;
  };
  weather_data?: {
    description: string;
    temperature: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    postsCount: 0,
    likesReceived: 0,
    rewardsReceived: 0,
    commentsReceived: 0,
  });
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'settings'>('posts');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: '',
    location: '',
  });

  // 使用Zustand store获取认证状态
  const { user, isAuthenticated, isLoading: authLoading, clearUser } = useAuthStore();

  // 模拟用户发布的内容（作为后备）
  const mockUserPosts: Post[] = [
    {
      id: '1',
      content: '今天阳光特别好，在阳台上晒了一下午的太阳，感觉整个人都被治愈了。简单的幸福就是这样，不需要多么复杂。',
      image_url: '/placeholder-sunny.jpg',
      created_at: '2024-12-13T14:00:00Z',
      likes_count: 45,
      comments_count: 8,
      rewards_count: 5,
      user: {
        nickname: user?.email?.split('@')[0] || '用户',
        avatar_url: user?.user_metadata?.avatar_url,
      },
      weather_data: {
        description: '晴天',
        temperature: 24,
      },
    },
    {
      id: '2',
      content: '和朋友们一起去了新开的咖啡店，点了一杯拿铁，配上店里温暖的灯光，聊了很久很久。友谊真的是生活中最珍贵的财富。',
      created_at: '2024-12-12T16:30:00Z',
      likes_count: 67,
      comments_count: 12,
      rewards_count: 8,
      user: {
        nickname: user?.email?.split('@')[0] || '用户',
        avatar_url: user?.user_metadata?.avatar_url,
      },
      location_data: {
        name: '温馨咖啡屋',
      },
    },
    {
      id: '3',
      content: '收到了远方朋友寄来的明信片，上面写着"想你了"三个字。虽然简单，但是比任何华丽的辞藻都要温暖。',
      created_at: '2024-12-11T20:00:00Z',
      likes_count: 89,
      comments_count: 15,
      rewards_count: 12,
      user: {
        nickname: user?.email?.split('@')[0] || '用户',
        avatar_url: user?.user_metadata?.avatar_url,
      },
    },
  ];

  // 检查登录状态
  useEffect(() => {
    // 等待认证状态初始化完成
    if (authLoading) return;
    
    if (!isAuthenticated) {
      toast.error('请先登录访问个人主页');
      router.push('/login');
      return;
    }

    // 初始化用户信息
    if (user) {
      const currentUserInfo: UserInfo = {
        id: user.id,
        nickname: user.email?.split('@')[0] || '用户',
        avatar_url: user.user_metadata?.avatar_url,
        bio: user.user_metadata?.bio || '这个人很懒，什么都没留下',
        location: user.user_metadata?.location || '未设置',
        created_at: user.created_at,
      };

      setUserInfo(currentUserInfo);
      setEditForm({
        nickname: currentUserInfo.nickname,
        bio: currentUserInfo.bio || '',
        location: currentUserInfo.location || '',
      });

      // 获取真实的用户统计数据
      fetchUserStats();
    }

    // 获取用户帖子数据
    fetchUserPosts();
  }, [user, isAuthenticated, authLoading, router]);

  // 获取用户统计数据
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUserStats(result.data);
        }
      } else {
        console.warn('获取用户统计失败，使用默认数据');
        // 保持默认的模拟数据
        setUserStats({
          postsCount: 0,
          likesReceived: 0,
          rewardsReceived: 0,
          commentsReceived: 0,
        });
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
      // 保持默认的模拟数据
      setUserStats({
        postsCount: 0,
        likesReceived: 0,
        rewardsReceived: 0,
        commentsReceived: 0,
      });
    }
  };

  // 获取用户帖子数据
  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        toast.error('登录已过期，请重新登录');
        router.push('/login');
        return;
      }

      // 获取所有帖子
      const response = await fetch('/api/posts?page=1&limit=50&sort_type=latest');
      const result = await response.json();
      
      // 修复数据格式处理 - 直接使用后端返回的格式
      if (result.data && Array.isArray(result.data)) {
        // 转换数据格式
        const transformedPosts = result.data.map((post: any) => ({
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          rewards_count: post.rewards_count || 0,
          user: {
            nickname: post.username || '用户',
            avatar_url: undefined
          },
          location_data: post.location ? { name: `位置 (${post.location.latitude}, ${post.location.longitude})` } : undefined,
          weather_data: post.weather ? { 
            description: post.weather.weather || post.weather.description || '未知天气', 
            temperature: post.weather.temperature || 0 
          } : undefined
        }));

        // 过滤当前用户的帖子 - 匹配用户ID
        const userFilteredPosts = transformedPosts.filter((post: any) => {
          const originalPost = result.data.find((p: any) => p.id === post.id);
          return originalPost && originalPost.user_id === user?.id;
        });

        setUserPosts(userFilteredPosts);
        console.log(`✅ 成功获取 ${userFilteredPosts.length} 个用户帖子`);
      } else {
        // 如果API失败，使用模拟数据
        console.warn('API返回格式异常，使用模拟数据');
        setUserPosts(mockUserPosts);
      }
    } catch (error) {
      console.error('获取用户帖子失败:', error);
      // 使用模拟数据作为后备
      setUserPosts(mockUserPosts);
    } finally {
      setLoading(false);
    }
  };

  // 退出登录
  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
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
    }
  };

  // 保存个人资料
  const handleSaveProfile = () => {
    if (!editForm.nickname.trim()) {
      toast.error('昵称不能为空');
      return;
    }

    // 模拟API调用
    setTimeout(() => {
      const updatedUserInfo = {
        ...userInfo!,
        nickname: editForm.nickname,
        bio: editForm.bio,
        location: editForm.location,
      };

      setUserInfo(updatedUserInfo);
      setIsEditingProfile(false);
      toast.success('资料更新成功！');
    }, 1000);
  };

  // 如果还在加载认证状态，显示加载页面
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">{authLoading ? '正在验证登录状态...' : '加载中...'}</p>
        </div>
      </div>
    );
  }

  // 如果未登录，不渲染内容（等待重定向）
  if (!isAuthenticated) {
    return null;
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* 头像 */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full flex items-center justify-center">
                {userInfo.avatar_url ? (
                  <Image
                    src={userInfo.avatar_url}
                    alt="用户头像"
                    width={96}
                    height={96}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              {/* 在线状态 */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-xs">✨</span>
              </div>
            </div>

            {/* 用户信息 */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {userInfo.nickname}
              </h2>
              <p className="text-gray-600 mb-4">
                {userInfo.bio}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <span>📍</span>
                  <span>{userInfo.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>📅</span>
                  <span>加入于 {new Date(userInfo.created_at).getFullYear()}年</span>
                </div>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">{userStats.postsCount}</div>
                  <div className="text-xs text-gray-600">发布内容</div>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-lg">
                  <div className="text-xl font-bold text-pink-600">{userStats.likesReceived}</div>
                  <div className="text-xs text-gray-600">收到点赞</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{userStats.rewardsReceived}</div>
                  <div className="text-xs text-gray-600">收到打赏</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{userStats.commentsReceived}</div>
                  <div className="text-xs text-gray-600">收到评论</div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-400 to-yellow-400 text-white rounded-lg hover:from-pink-500 hover:to-yellow-500 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>编辑资料</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <span>🚪</span>
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📝 我的发布 ({userStats.postsCount})
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'liked'
                    ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ❤️ 我的点赞
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ⚙️ 设置
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 我的发布 */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {userPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={(postId) => console.log('点赞:', postId)}
                        onComment={(postId) => console.log('评论:', postId)}
                        onReward={(postId) => console.log('打赏:', postId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      还没有发布内容
                    </h3>
                    <p className="text-gray-500 mb-6">
                      去首页分享你的第一个小确幸吧
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className="px-6 py-3 bg-gradient-to-r from-pink-400 to-yellow-400 text-white rounded-xl hover:from-pink-500 hover:to-yellow-500 transition-all shadow-md hover:shadow-lg"
                    >
                      去发布内容
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 我的点赞 */}
            {activeTab === 'liked' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">❤️</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  点赞的内容
                </h3>
                <p className="text-gray-500">
                  您点赞的内容将在这里显示
                </p>
              </div>
            )}

            {/* 设置 */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    🔔 通知设置
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">点赞通知</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">评论通知</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">打赏通知</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    🔒 隐私设置
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">公开个人资料</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">允许搜索到我</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                  </div>
                </div>

                <div className="border border-red-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-red-600 mb-4">
                    ⚠️ 危险操作
                  </h4>
                  <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                    删除账号
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑资料弹窗 */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              ✏️ 编辑个人资料
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  昵称
                </label>
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人简介
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={100}
                  placeholder="介绍一下你自己吧"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所在地
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
                  maxLength={30}
                  placeholder="你在哪个城市呢"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-400 to-yellow-400 text-white rounded-xl hover:from-pink-500 hover:to-yellow-500 transition-all shadow-md hover:shadow-lg"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 