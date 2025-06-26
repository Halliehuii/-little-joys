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
    console.log('🚀 开始获取帖子数据...')
    try {
      setLoading(true)
      console.log('📡 发送API请求到: /api/posts')
      
      // 直接调用FastAPI后端
      const { apiRequest } = await import('../lib/api')
      const result = await apiRequest.get('/api/posts', {
        page: 1,
        limit: 20,
        sort_type: 'latest'
      })
      
      console.log('📋 API响应数据:', result)
      
      // 检查数据格式
      if (result.data && Array.isArray(result.data.posts)) {
        console.log('✅ 数据格式正确，开始转换...')
        // 简化数据转换
        const transformedPosts = result.data.posts.map((post: any) => ({
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          rewards_count: post.rewards_count || 0,
          user: {
            nickname: post.username || '匿名用户',
            avatar_url: undefined
          },
          location_data: post.location?.address ? { name: post.location.address } : undefined,
          weather_data: post.weather?.description ? { 
            description: post.weather.description, 
            temperature: post.weather.temperature || 0 
          } : undefined
        }))
        
        console.log('🎯 转换后的帖子数据:', transformedPosts)
        setPosts(transformedPosts)
        console.log(`✅ 成功设置 ${transformedPosts.length} 个帖子`)
      } else {
        console.warn('⚠️ API返回数据格式异常:', result)
        setPosts([])
      }
    } catch (error) {
      console.error('❌ 获取帖子失败:', error)
      setPosts([])
    } finally {
      console.log('🏁 设置loading为false')
      setLoading(false)
    }
  }

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
      // 使用API工具发送请求，自动处理认证
      const { apiRequest } = await import('../lib/api')
      
      const response = await apiRequest.post('/api/posts', {
        content: postData.content,
        image_url: postData.image ? 'placeholder' : undefined, // 临时处理图片上传
        location: postData.location ? {
          latitude: 0,
          longitude: 0,
          address: postData.location
        } : undefined,
        weather: postData.weather ? {
          temperature: 22,
          description: postData.weather
        } : undefined
      })

      if (response.data) {
        // 重新获取帖子列表以显示新内容
        await fetchPosts()
        setShowCreatePost(false)
        alert('发布成功！')
      } else {
        throw new Error(response.message || '发布失败')
      }
    } catch (error: any) {
      console.error('发布失败:', error)
      
      // 如果是认证错误，不需要额外处理，API拦截器已经处理了
      if (error.response?.status === 401) {
        return // 让API拦截器处理认证失败
      }
      
      // 其他错误显示具体信息
      const errorMessage = error.response?.data?.message || error.message || '发布失败，请重试'
      alert(errorMessage)
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
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4">
          {loading ? (
            // 加载状态 - 显示3个占位符
            <>
              {[1, 2, 3].map((index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="mt-4 h-48 bg-gray-200 rounded-xl"></div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div className="flex space-x-6">
                      <div className="h-8 w-12 bg-gray-200 rounded-full"></div>
                      <div className="h-8 w-12 bg-gray-200 rounded-full"></div>
                      <div className="h-8 w-12 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </>
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
            // 便签列表 - 单列布局
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