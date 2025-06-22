'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PostCardProps {
  post: {
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
  };
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onReward?: (postId: string) => void;
}

const PostCard = ({ post, onLike, onComment, onReward }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(post.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTagColor = () => {
    const colors = [
      'bg-yellow-200 text-yellow-800',
      'bg-pink-200 text-pink-800',
      'bg-green-200 text-green-800',
      'bg-blue-200 text-blue-800',
      'bg-purple-200 text-purple-800',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-pink-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 mb-6 border border-yellow-100">
      {/* 用户信息和时间 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-300 to-yellow-300 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {post.user.avatar_url ? (
              <Image
                src={post.user.avatar_url}
                alt="头像"
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              post.user.nickname.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{post.user.nickname}</p>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
          </div>
        </div>
        
        {/* 位置和天气信息 */}
        {(post.location_data || post.weather_data) && (
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            {post.location_data && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                📍 {post.location_data.name}
              </span>
            )}
            {post.weather_data && (
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                🌡️ {post.weather_data.temperature}°C {post.weather_data.description}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed">
          {showFullContent || post.content.length <= 100 
            ? post.content 
            : `${post.content.substring(0, 100)}...`}
        </p>
        {post.content.length > 100 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-yellow-600 hover:text-yellow-700 text-sm mt-2 font-medium"
          >
            {showFullContent ? '收起' : '展开'}
          </button>
        )}
      </div>

      {/* 图片展示 */}
      {post.image_url && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <Image
            src={post.image_url}
            alt="配图"
            width={600}
            height={400}
            className="w-full h-auto max-h-80 object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* 标签区域 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTagColor()}`}>
          拌麻慧子
        </span>
      </div>

      {/* 互动区域 */}
      <div className="flex items-center justify-between pt-4 border-t border-yellow-100">
        <div className="flex items-center space-x-6">
          {/* 点赞 */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all ${
              isLiked 
                ? 'bg-red-100 text-red-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className={`text-lg ${isLiked ? '❤️' : '🤍'}`}>
              {isLiked ? '❤️' : '🤍'}
            </span>
            <span className="text-sm">{post.likes_count + (isLiked ? 1 : 0)}</span>
          </button>

          {/* 评论 */}
          <button
            onClick={() => onComment?.(post.id)}
            className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="text-lg">💬</span>
            <span className="text-sm">{post.comments_count}</span>
          </button>

          {/* 打赏 */}
          <button
            onClick={() => onReward?.(post.id)}
            className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 hover:bg-yellow-100 hover:text-yellow-600 transition-colors"
          >
            <span className="text-lg">💰</span>
            <span className="text-sm">{post.rewards_count}</span>
          </button>
        </div>

        {/* 分享 */}
        <button className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
          <span className="text-lg">📤</span>
          <span className="text-sm">分享</span>
        </button>
      </div>

      {/* 热门评论预览 */}
      {post.comments_count > 0 && (
        <div className="mt-4 pt-4 border-t border-yellow-100">
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">热门评论：</span>
            </p>
            <p className="text-sm text-gray-800">
              这真是太美好了！生活中的小确幸总是让人感动 ✨
            </p>
          </div>
          <button
            onClick={() => onComment?.(post.id)}
            className="text-xs text-yellow-600 hover:text-yellow-700 mt-2 font-medium"
          >
            查看全部 {post.comments_count} 条评论
          </button>
        </div>
      )}
    </div>
  );
};

export default PostCard; 