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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '今天';
    if (diffDays <= 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 根据帖子ID生成随机渐变背景
  const getBackgroundGradient = () => {
    const gradients = [
      'from-yellow-100 to-pink-100',
      'from-blue-100 to-purple-100', 
      'from-green-100 to-teal-100',
      'from-orange-100 to-red-100',
      'from-indigo-100 to-blue-100',
      'from-pink-100 to-rose-100',
      'from-purple-100 to-indigo-100',
      'from-teal-100 to-green-100'
    ];
    
    const postIdHash = post.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[Math.abs(postIdHash) % gradients.length];
  };

  return (
    <div className={`bg-gradient-to-br h-full ${getBackgroundGradient()} rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 border border-opacity-20 border-gray-300 aspect-square flex flex-col justify-between relative group hover:scale-105`}>
      
      {/* 用户信息 - 顶部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-300 to-yellow-300 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {post.user.avatar_url ? (
              <Image
                src={post.user.avatar_url}
                alt="头像"
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              post.user.nickname.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-800 text-sm truncate">{post.user.nickname}</p>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
          </div>
        </div>
        
        {/* 位置或天气信息 - 简化显示 */}
        {(post.location_data || post.weather_data) && (
          <div className="text-xs">
            {post.location_data && (
              <span className="text-blue-600">📍</span>
            )}
            {post.weather_data && (
              <span className="text-orange-600">🌡️{post.weather_data.temperature}°</span>
            )}
          </div>
        )}
      </div>

      {/* 内容区域 - 中间 */}
      <div className="flex-1 flex flex-col justify-center mb-3">
        {/* 图片展示 */}
        {post.image_url && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <Image
              src={post.image_url}
              alt="配图"
              width={200}
              height={120}
              className="w-full h-20 object-cover hover:scale-110 transition-transform duration-300"
            />
          </div>
        )}
        
        {/* 文字内容 */}
        <div>
          <p className="text-gray-800 text-sm leading-relaxed text-left">
            {post.content.length <= 60 
              ? post.content 
              : showFullContent 
                ? post.content
                : `${post.content.substring(0, 60)}...`}
          </p>
          {post.content.length > 60 && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-yellow-600 hover:text-yellow-700 text-xs mt-1 font-medium"
            >
              {showFullContent ? '收起' : '展开'}
            </button>
          )}
        </div>
      </div>

      {/* 互动区域 - 底部 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 border-opacity-50">
        <div className="flex items-center space-x-3">
          {/* 点赞 */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all text-xs ${
              isLiked 
                ? 'bg-red-100 text-red-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-sm">{isLiked ? '❤️' : '🤍'}</span>
            <span>{post.likes_count + (isLiked ? 1 : 0)}</span>
          </button>

          {/* 评论 */}
          <button
            onClick={() => onComment?.(post.id)}
            className="flex items-center space-x-1 px-2 py-1 rounded-full text-gray-600 hover:bg-gray-100 transition-colors text-xs"
          >
            <span className="text-sm">💬</span>
            <span>{post.comments_count}</span>
          </button>

          {/* 打赏 */}
          <button
            onClick={() => onReward?.(post.id)}
            className="flex items-center space-x-1 px-2 py-1 rounded-full text-gray-600 hover:bg-yellow-100 hover:text-yellow-600 transition-colors text-xs"
          >
            <span className="text-sm">💰</span>
            <span>{post.rewards_count}</span>
          </button>
        </div>

        {/* 分享 */}
        <button className="text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors">
          <span className="text-sm">📤</span>
        </button>
      </div>

      {/* 悬停时显示的更多信息 */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-2xl transition-all duration-300 pointer-events-none"></div>
    </div>
  );
};

export default PostCard; 