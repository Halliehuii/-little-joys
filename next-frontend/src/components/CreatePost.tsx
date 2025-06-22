'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';

interface CreatePostProps {
  onSubmit: (postData: {
    content: string;
    image?: File;
    location?: string;
    weather?: string;
  }) => void;
  onCancel: () => void;
  isVisible: boolean;
}

const CreatePost = ({ onSubmit, onCancel, isVisible }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 处理图片选择
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }

      // 检查文件类型
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('只支持JPG和PNG格式的图片');
        return;
      }

      setSelectedImage(file);
      
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 移除图片
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 自动获取位置
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理位置功能');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 这里应该调用地理编码API将坐标转换为地址
        // 暂时用模拟数据
        setLocation('北京市朝阳区');
      },
      (error) => {
        console.error('获取位置失败:', error);
        alert('获取位置失败，请手动输入');
      }
    );
  };

  // 自动获取天气
  const handleGetWeather = () => {
    // 这里应该调用天气API
    // 暂时用模拟数据
    const weathers = ['晴天', '多云', '小雨', '阴天', '雪'];
    const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
    setWeather(`${randomWeather} 22°C`);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('请输入内容');
      return;
    }

    if (content.length > 500) {
      alert('内容不能超过500字');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        content: content.trim(),
        image: selectedImage || undefined,
        location,
        weather,
      });

      // 重置表单
      setContent('');
      setSelectedImage(null);
      setImagePreview('');
      setLocation('');
      setWeather('');
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 自动调整文本框高度
  const adjustTextAreaHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-yellow-50 to-pink-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-100 to-pink-100 p-6 border-b border-yellow-200 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="text-2xl mr-2">✨</span>
              写一件幸福小事
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* 文字输入区域 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文字 <span className="text-gray-400">你的日记预告</span>
            </label>
            <textarea
              ref={textAreaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                adjustTextAreaHeight();
              }}
              placeholder="记录下你的幸福瞬间..."
              className="w-full p-4 border border-yellow-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent bg-white placeholder-gray-400 text-gray-800 leading-relaxed"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {content.length}/500
              </span>
            </div>
          </div>

          {/* 图片上传区域 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">图片</label>
              <span className="text-xs text-gray-500">支持JPG、PNG，最大5MB</span>
            </div>
            
            {imagePreview ? (
              <div className="relative">
                <Image
                  src={imagePreview}
                  alt="预览"
                  width={600}
                  height={400}
                  className="w-full h-64 object-cover rounded-xl border border-yellow-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-yellow-300 rounded-xl p-8 text-center hover:border-yellow-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-sm">点击上传图片</span>
                </button>
              </div>
            )}
          </div>

          {/* 位置和天气 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 地点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">地点</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="不添加地点"
                  className="flex-1 p-3 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent bg-white"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
                >
                  📍 自动获取位置
                </button>
              </div>
            </div>

            {/* 天气 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">天气</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  placeholder="不添加天气"
                  className="flex-1 p-3 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent bg-white"
                />
                <button
                  type="button"
                  onClick={handleGetWeather}
                  className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors whitespace-nowrap"
                >
                  🌤️ 自动获取天气
                </button>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-8 py-3 bg-gradient-to-r from-pink-400 to-yellow-400 text-white rounded-full hover:from-pink-500 hover:to-yellow-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>发布中...</span>
                </>
              ) : (
                <>
                  <span>💫</span>
                  <span>确认上传</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost; 