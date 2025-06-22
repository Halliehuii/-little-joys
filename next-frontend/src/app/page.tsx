'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import CreatePost from '@/components/CreatePost'

interface Post {
  id: string
  content: string
  image_url?: string
  created_at: string
  likes_count: number
  comments_count: number
  rewards_count: number
  user: {
    nickname: string
    avatar_url?: string
  }
  location_data?: {
    name: string
  }
  weather_data?: {
    description: string
    temperature: number
  }
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 获取帖子数据
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts?page=1&limit=20&sort_type=latest')
      const result = await response.json()
      
      // 修复数据格式处理 - 直接使用后端返回的格式
      if (result.data && Array.isArray(result.data)) {
        // 转换后端数据格式为前端格式
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
        }))
        setPosts(transformedPosts)
        console.log(`✅ 成功获取 ${transformedPosts.length} 个帖子`)
      } else {
        // 如果API失败，使用模拟数据作为后备
        console.warn('API返回格式异常，使用模拟数据')
        setPosts(mockPosts)
      }
    } catch (error) {
      console.error('获取帖子失败:', error)
      // 使用模拟数据作为后备
      setPosts(mockPosts)
    } finally {
      setLoading(false)
    }
  }

  // 模拟数据（作为后备）
  const mockPosts: Post[] = [
    {
      id: '1',
      content: '生活就像这块⭐芝士吐司。',
      image_url: '/placeholder-toast.jpg',
      created_at: '2024-12-13T20:00:00Z',
      likes_count: 42,
      comments_count: 8,
      rewards_count: 3,
      user: {
        nickname: 'Sloppy_Girl',
        avatar_url: undefined,
      },
      location_data: {
        name: '橙黄色灯光',
      },
      weather_data: {
        description: '晴',
        temperature: 22,
      },
    },
    {
      id: '2',
      content: '今天中午吃饭去其他档口买红豆汤，我说我想要多一点丸子，阿姨努力的首了两丸子！阿姨真好丸子真好多！喝红豆汤真好。',
      created_at: '2024-12-13T19:30:00Z',
      likes_count: 35,
      comments_count: 12,
      rewards_count: 5,
      user: {
        nickname: '小确幸收集者',
        avatar_url: undefined,
      },
      location_data: {
        name: '学校食堂',
      },
    },
    {
      id: '3',
      content: '卜卜分享了她今天的星巴克口令"期待新的故事发生"，我接了句也想偶她就立刻给我点了，在这一刻我隔空享了一样的焦糖咖啡和可爱口令，真想卜卜啊！',
      created_at: '2024-12-13T18:45:00Z',
      likes_count: 67,
      comments_count: 15,
      rewards_count: 8,
      user: {
        nickname: '远方朋友',
        avatar_url: undefined,
      },
    },
    {
      id: '4',
      content: '下班时在地铁口看到了久违的蛋卷大叔，10元立刻拿下一包，他今天的鼻子被风吹的红红的。',
      created_at: '2025-01-10T20:00:00Z',
      likes_count: 28,
      comments_count: 6,
      rewards_count: 2,
      user: {
        nickname: '地铁通勤者',
        avatar_url: undefined,
      },
      location_data: {
        name: '地铁站',
      },
    },
    {
      id: '5',
      content: '坐在沙发上看火线，外面的天慢慢暗下去，空调从左边吹来热热的，阿斯在左边睡的微微张开，缩缩在左边睡的头垂着的，我也容易欲睡。',
      created_at: '2025-01-20T20:00:00Z',
      likes_count: 43,
      comments_count: 9,
      rewards_count: 4,
      user: {
        nickname: '懒懒下午',
        avatar_url: undefined,
      },
      weather_data: {
        description: '阴天',
        temperature: 18,
      },
    },
  ]

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)

    // 获取帖子数据
    fetchPosts()
  }, [])

  // 处理点赞
  const handleLike = (postId: string) => {
    if (!isLoggedIn) {
      alert('请先登录再进行操作')
      return
    }
    // 这里应该调用API
    console.log('点赞:', postId)
  }

  // 处理评论
  const handleComment = (postId: string) => {
    if (!isLoggedIn) {
      alert('请先登录再进行操作')
      return
    }
    // 这里应该跳转到评论页面或弹出评论框
    console.log('评论:', postId)
  }

  // 处理打赏
  const handleReward = (postId: string) => {
    if (!isLoggedIn) {
      alert('请先登录再进行操作')
      return
    }
    // 这里应该打开打赏弹窗
    console.log('打赏:', postId)
  }

  // 处理新建便签
  const handleCreatePost = async (postData: {
    content: string
    image?: File
    location?: string
    weather?: string
  }) => {
    if (!isLoggedIn) {
      alert('请先登录')
      return
    }

    try {
      // 获取认证token
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('登录已过期，请重新登录');
        return;
      }

      // 调用API创建帖子
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: postData.content,
          image: postData.image,
          location: postData.location,
          weather: postData.weather
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '发布失败');
      }

      if (result.success) {
        // 重新获取帖子列表以显示新内容
        await fetchPosts();
        setShowCreatePost(false);
        alert('发布成功！');
      } else {
        throw new Error(result.message || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 欢迎标语 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Find Your Happy in the Little Things
          </h1>
          <p className="text-gray-600">
            Joy Lives in the Details
          </p>
        </div>

        {/* 新建便签按钮 */}
        {isLoggedIn && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-gradient-to-r from-pink-400 to-yellow-400 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:from-pink-500 hover:to-yellow-500 transform hover:scale-105 flex items-center space-x-3 mx-auto"
            >
              <span className="text-2xl">✨</span>
              <span className="font-medium">写一件幸福小事</span>
            </button>
          </div>
        )}

        {/* 便签列表 */}
        <div className="space-y-6">
          {loading ? (
            // 加载状态
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">🌸</div>
                <p className="text-gray-600">正在加载幸福小事...</p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            // 空状态
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                还没有人分享小确幸
              </h3>
              <p className="text-gray-500 mb-6">
                成为第一个分享生活美好瞬间的人吧！
              </p>
              {isLoggedIn && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-gradient-to-r from-pink-400 to-yellow-400 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  写下第一个小确幸
                </button>
              )}
            </div>
          ) : (
            // 便签列表
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onReward={handleReward}
              />
            ))
          )}
        </div>

        {/* 加载更多按钮 */}
        {!loading && posts.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-white text-gray-600 px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200 hover:border-gray-300">
              <span className="mr-2">📖</span>
              加载更多小确幸
            </button>
          </div>
        )}
      </div>

      {/* 新建便签弹窗 */}
      <CreatePost
        isVisible={showCreatePost}
        onSubmit={handleCreatePost}
        onCancel={() => setShowCreatePost(false)}
      />
    </div>
  )
} 