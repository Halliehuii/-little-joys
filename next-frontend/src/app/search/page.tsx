'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';

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

interface SearchFilters {
  sortBy: 'latest' | 'popular' | 'oldest';
  timeRange: 'all' | 'today' | 'week' | 'month';
  hasImage: 'all' | 'yes' | 'no';
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'latest',
    timeRange: 'all',
    hasImage: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  // 模拟搜索数据
  const mockSearchResults: Post[] = [
    {
      id: '1',
      content: '今天在咖啡店遇到了一只超可爱的小猫，它一直在我脚边转悠，太治愈了！',
      image_url: '/placeholder-cat.jpg',
      created_at: '2024-12-13T20:00:00Z',
      likes_count: 42,
      comments_count: 8,
      rewards_count: 3,
      user: {
        nickname: '猫咪爱好者',
        avatar_url: undefined,
      },
      location_data: {
        name: '星巴克咖啡',
      },
    },
    {
      id: '2',
      content: '下雨天在家听音乐，窗外的雨声和室内的温暖形成了最美的对比。',
      created_at: '2024-12-13T18:30:00Z',
      likes_count: 67,
      comments_count: 12,
      rewards_count: 5,
      user: {
        nickname: '雨天诗人',
        avatar_url: undefined,
      },
      weather_data: {
        description: '小雨',
        temperature: 18,
      },
    },
    {
      id: '3',
      content: '妈妈今天给我寄了家乡的特产，打开包裹的那一刻，满满的都是爱。',
      created_at: '2024-12-12T16:00:00Z',
      likes_count: 89,
      comments_count: 15,
      rewards_count: 8,
      user: {
        nickname: '思乡的孩子',
        avatar_url: undefined,
      },
    },
  ];

  // 处理搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('请输入搜索内容');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    // 模拟API调用
    setTimeout(() => {
      // 简单的模拟搜索逻辑
      const filtered = mockSearchResults.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // 应用筛选器
      let results = [...filtered];

      // 排序
      switch (filters.sortBy) {
        case 'popular':
          results.sort((a, b) => (b.likes_count + b.rewards_count) - (a.likes_count + a.rewards_count));
          break;
        case 'oldest':
          results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'latest':
        default:
          results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
      }

      // 图片筛选
      if (filters.hasImage === 'yes') {
        results = results.filter(post => post.image_url);
      } else if (filters.hasImage === 'no') {
        results = results.filter(post => !post.image_url);
      }

      setSearchResults(results);
      setLoading(false);
    }, 800);
  };

  // 处理回车搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // 热门搜索标签
  const popularTags = [
    '咖啡', '小猫', '下雨天', '妈妈', '家乡', '音乐', '温暖', '治愈'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 搜索标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔍 发现更多小确幸
          </h1>
          <p className="text-gray-600">
            搜索那些触动心灵的美好瞬间
          </p>
        </div>

        {/* 搜索框区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex space-x-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="搜索小确幸内容、用户昵称..."
                className="w-full px-4 py-3 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ❌
                </button>
              )}
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-yellow-400 text-white rounded-xl hover:from-pink-500 hover:to-yellow-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">🔍</span>
                  <span>搜索中...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>搜索</span>
                </>
              )}
            </button>
          </div>

          {/* 筛选器切换 */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span>🎛️</span>
              <span>{showFilters ? '隐藏筛选' : '显示筛选'}</span>
            </button>

            {hasSearched && (
              <span className="text-sm text-gray-500">
                找到 {searchResults.length} 条结果
              </span>
            )}
          </div>

          {/* 筛选器选项 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-yellow-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 排序方式 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序方式
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="w-full p-2 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="latest">最新发布</option>
                    <option value="popular">最受欢迎</option>
                    <option value="oldest">最早发布</option>
                  </select>
                </div>

                {/* 时间范围 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    时间范围
                  </label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => setFilters({ ...filters, timeRange: e.target.value as any })}
                    className="w-full p-2 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="all">全部时间</option>
                    <option value="today">今天</option>
                    <option value="week">本周</option>
                    <option value="month">本月</option>
                  </select>
                </div>

                {/* 是否有图片 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    图片内容
                  </label>
                  <select
                    value={filters.hasImage}
                    onChange={(e) => setFilters({ ...filters, hasImage: e.target.value as any })}
                    className="w-full p-2 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    <option value="all">全部内容</option>
                    <option value="yes">仅有图片</option>
                    <option value="no">仅文字</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 热门搜索标签 */}
        {!hasSearched && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 热门搜索</h3>
            <div className="flex flex-wrap gap-3">
              {popularTags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(tag);
                    // 自动搜索
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors text-sm font-medium"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">🔍</div>
                <p className="text-gray-600">正在搜索中...</p>
              </div>
            </div>
          ) : hasSearched ? (
            searchResults.length > 0 ? (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  为您找到 <span className="font-semibold text-gray-800">{searchResults.length}</span> 条相关结果，搜索关键词：
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full ml-1 font-medium">
                    "{searchQuery}"
                  </span>
                </div>
                {searchResults.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={(postId) => console.log('点赞:', postId)}
                    onComment={(postId) => console.log('评论:', postId)}
                    onReward={(postId) => console.log('打赏:', postId)}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🤔</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  没有找到相关内容
                </h3>
                <p className="text-gray-500 mb-6">
                  换个关键词试试，或者试试热门搜索标签
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularTags.slice(0, 4).map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(tag);
                        setTimeout(() => handleSearch(), 100);
                      }}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors text-sm"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                开始探索小确幸吧
              </h3>
              <p className="text-gray-500 mb-6">
                输入关键词搜索，或者点击热门标签快速开始
              </p>
            </div>
          )}
        </div>

        {/* 没有更多结果 */}
        {hasSearched && searchResults.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">
              已显示全部搜索结果 📖
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 