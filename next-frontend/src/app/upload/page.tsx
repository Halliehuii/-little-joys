'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store/auth';
import toast from 'react-hot-toast';
import { AuthManager } from '@/utils/auth'

export default function UploadPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 自动获取位置
  const [locationLoading, setLocationLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // 使用Zustand store获取认证状态
  const { isAuthenticated, isLoading } = useAuthStore();

  // 检查登录状态
  useEffect(() => {
    // 等待认证状态初始化完成
    if (isLoading) return;
    
    if (!isAuthenticated) {
      toast.error('请先登录才能发布内容');
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // 如果还在加载认证状态，显示加载页面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  // 如果未登录，不渲染内容（等待重定向）
  if (!isAuthenticated) {
    return null;
  }

  // 处理图片选择
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过5MB');
        return;
      }

      // 检查文件类型
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error('只支持JPG和PNG格式的图片');
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

  // 获取位置
  const handleGetLocation = async () => {
    setLocationLoading(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('您的浏览器不支持位置服务');
      }

      // 获取用户坐标
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      console.log('获取到的坐标:', latitude, longitude);

      // 调用服务器端API路由获取地址
      const response = await fetch(`/api/location?lat=${latitude}&lng=${longitude}`);
      
      if (!response.ok) {
        throw new Error('获取地址信息失败');
      }

      const data = await response.json();
      
      if (data.success) {
        setLocation(data.address);
        toast.success(`📍 定位成功！获取到地址：${data.address}`);
      } else {
        throw new Error(data.error || '地址解析失败');
      }
      
    } catch (error) {
      console.error('位置获取错误:', error);
      
      let errorMessage = '获取位置失败';
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case 1:
            errorMessage = '请允许访问您的位置信息';
            break;
          case 2:
            errorMessage = '无法获取您的位置信息';
            break;
          case 3:
            errorMessage = '获取位置信息超时';
            break;
          default:
            errorMessage = '获取位置信息失败';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(`${errorMessage}，请手动输入位置信息`);
      setLocation('请手动输入位置');
    } finally {
      setLocationLoading(false);
    }
  };

  // 获取天气
  const handleGetWeather = async () => {
    setWeatherLoading(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('您的浏览器不支持位置服务');
      }

      // 获取用户坐标
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      console.log('获取天气坐标:', latitude, longitude);

      // 调用服务器端API路由获取天气
      const response = await fetch(`/api/weather?lat=${latitude}&lng=${longitude}`);
      
      if (!response.ok) {
        throw new Error('获取天气信息失败');
      }

      const data = await response.json();
      
      if (data.success) {
        setWeather(data.weather);
        toast.success(`🌤️ 天气获取成功！${data.details.location}：${data.weather}`);
      } else {
        throw new Error(data.error || '天气解析失败');
      }
      
    } catch (error) {
      console.error('天气获取错误:', error);
      
      let errorMessage = '获取天气失败';
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case 1:
            errorMessage = '请允许访问您的位置信息';
            break;
          case 2:
            errorMessage = '无法获取您的位置信息';
            break;
          case 3:
            errorMessage = '获取位置信息超时';
            break;
          default:
            errorMessage = '获取位置信息失败';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(`${errorMessage}，请手动输入天气信息`);
      setWeather('请手动输入天气');
    } finally {
      setWeatherLoading(false);
    }
  };

  // 根据天气主要类型获取图标
  const getWeatherIcon = (weatherMain: string): string => {
    const iconMap: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '⛅',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    return iconMap[weatherMain] || '🌤️';
  };
  
  // 根据天气代码获取图标
  const getWeatherIconFromCode = (code: string): string => {
    const codeMap: { [key: string]: string } = {
      '113': '☀️', // Sunny
      '116': '⛅', // Partly cloudy
      '119': '☁️', // Cloudy
      '122': '☁️', // Overcast
      '143': '🌫️', // Mist
      '176': '🌦️', // Patchy rain possible
      '179': '🌨️', // Patchy snow possible
      '182': '🌧️', // Patchy sleet possible
      '185': '🌧️', // Patchy freezing drizzle possible
      '200': '⛈️', // Thundery outbreaks possible
      '227': '❄️', // Blowing snow
      '230': '❄️', // Blizzard
      '248': '🌫️', // Fog
      '260': '🌫️', // Freezing fog
      '263': '🌦️', // Patchy light drizzle
      '266': '🌧️', // Light drizzle
      '281': '🌧️', // Freezing drizzle
      '284': '🌧️', // Heavy freezing drizzle
      '293': '🌦️', // Patchy light rain
      '296': '🌧️', // Light rain
      '299': '🌧️', // Moderate rain at times
      '302': '🌧️', // Moderate rain
      '305': '🌧️', // Heavy rain at times
      '308': '🌧️', // Heavy rain
      '311': '🌧️', // Light freezing rain
      '314': '🌧️', // Moderate or heavy freezing rain
      '317': '🌧️', // Light sleet
      '320': '🌧️', // Moderate or heavy sleet
      '323': '🌨️', // Patchy light snow
      '326': '❄️', // Light snow
      '329': '❄️', // Patchy moderate snow
      '332': '❄️', // Moderate snow
      '335': '❄️', // Patchy heavy snow
      '338': '❄️', // Heavy snow
      '350': '🌧️', // Ice pellets
      '353': '🌦️', // Light rain shower
      '356': '🌧️', // Moderate or heavy rain shower
      '359': '🌧️', // Torrential rain shower
      '362': '🌨️', // Light sleet showers
      '365': '🌨️', // Moderate or heavy sleet showers
      '368': '🌨️', // Light snow showers
      '371': '❄️', // Moderate or heavy snow showers
      '374': '🌧️', // Light showers of ice pellets
      '377': '🌧️', // Moderate or heavy showers of ice pellets
      '386': '⛈️', // Patchy light rain with thunder
      '389': '⛈️', // Moderate or heavy rain with thunder
      '392': '⛈️', // Patchy light snow with thunder
      '395': '⛈️'  // Moderate or heavy snow with thunder
    };
    return codeMap[code] || '🌤️';
  };
  
  // 生成合理的天气数据
  const generateReasonableWeather = (latitude: number, month: number, hour: number) => {
    let temp, desc, icon;
    
    // 基于纬度和季节调整温度
    let baseTemp;
    if (latitude > 45) { // 北方地区
      baseTemp = month >= 11 || month <= 2 ? -5 : month >= 3 && month <= 5 ? 15 : month >= 6 && month <= 8 ? 25 : 10;
    } else if (latitude > 30) { // 中部地区
      baseTemp = month >= 12 || month <= 2 ? 5 : month >= 3 && month <= 5 ? 20 : month >= 6 && month <= 8 ? 30 : 18;
    } else { // 南方地区
      baseTemp = month >= 12 || month <= 2 ? 15 : month >= 3 && month <= 5 ? 25 : month >= 6 && month <= 8 ? 32 : 25;
    }
    
    // 根据时间调整（夜晚更凉爽）
    if (hour >= 22 || hour <= 6) {
      baseTemp -= 5;
    } else if (hour >= 12 && hour <= 16) {
      baseTemp += 3;
    }
    
    // 添加随机变化
    temp = baseTemp + Math.floor(Math.random() * 8 - 4);
    
    // 根据季节和随机因素确定天气
    const weatherTypes = month >= 12 || month <= 2 ? 
      [{ desc: '晴天', icon: '☀️' }, { desc: '多云', icon: '⛅' }, { desc: '阴天', icon: '☁️' }] :
      month >= 6 && month <= 8 ?
      [{ desc: '晴天', icon: '☀️' }, { desc: '多云', icon: '⛅' }, { desc: '雷阵雨', icon: '⛈️' }] :
      [{ desc: '晴天', icon: '☀️' }, { desc: '多云', icon: '⛅' }, { desc: '小雨', icon: '🌦️' }];
    
    const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    return {
      temp,
      desc: weather.desc,
      icon: weather.icon
    };
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('请输入内容');
      return;
    }

    if (content.length > 500) {
      toast.error('内容不能超过500字');
      return;
    }

    setIsSubmitting(true);

    try {
      // 使用AuthManager确保Token有效
      const token = await AuthManager.ensureValidToken();
      if (!token) {
        // ensureValidToken已经处理了错误和跳转
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
          content: content.trim(),
          image: selectedImage,
          location: location.trim() || undefined,
          weather: weather.trim() || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // 如果是认证相关错误，使用AuthManager处理
        if (response.status === 401) {
          AuthManager.handleAuthError('登录已过期，请重新登录');
          return;
        }
        throw new Error(result.message || '发布失败');
      }

      if (result.success) {
        toast.success('发布成功！🎉');
        
        // 重置表单
        setContent('');
        setSelectedImage(null);
        setImagePreview('');
        setLocation('');
        setWeather('');
        
        // 跳转到首页
        router.push('/');
      } else {
        throw new Error(result.message || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error);
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('发布失败，请重试');
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <span className="text-4xl mr-3">✨</span>
            写一件幸福小事
          </h1>
          <p className="text-gray-600">
            记录生活中那些温暖的瞬间
          </p>
        </div>

        {/* 主要表单 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 表单头部 */}
          <div className="bg-gradient-to-r from-yellow-100 to-pink-100 p-6 border-b border-yellow-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                📝 分享你的小确幸
              </h2>
              <div className="text-sm text-gray-600">
                {content.length}/500 字
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 文字输入区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <span className="flex items-center">
                  <span className="text-lg mr-2">📖</span>
                  文字内容
                  <span className="text-gray-400 text-xs ml-2">分享你的心情和故事</span>
                </span>
              </label>
              <textarea
                ref={textAreaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  adjustTextAreaHeight();
                }}
                placeholder="今天发生了什么让你感到幸福的事情呢？&#10;&#10;可以是一杯温暖的咖啡，一个意外的惊喜，或者是朋友的一句问候..."
                className="w-full p-4 border border-yellow-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent bg-yellow-50/30 placeholder-gray-400 text-gray-800 leading-relaxed min-h-[120px]"
                maxLength={500}
                onInput={adjustTextAreaHeight}
              />
            </div>

            {/* 图片上传区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <span className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="text-lg mr-2">📷</span>
                    配图
                    <span className="text-gray-400 text-xs ml-2">让回忆更生动</span>
                  </span>
                  <span className="text-xs text-gray-500">支持JPG、PNG，最大5MB</span>
                </span>
              </label>
              
              {imagePreview ? (
                <div className="relative group">
                  <Image
                    src={imagePreview}
                    alt="预览"
                    width={600}
                    height={400}
                    className="w-full h-64 object-cover rounded-xl border border-yellow-200 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-xl flex items-center justify-center">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                    >
                      ❌
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    点击 ❌ 可移除图片
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-yellow-300 rounded-xl p-12 text-center hover:border-yellow-400 hover:bg-yellow-50/20 transition-all cursor-pointer group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full text-gray-500 group-hover:text-gray-700 transition-colors"
                  >
                    <span className="text-6xl mb-4 group-hover:scale-110 transition-transform">📷</span>
                    <span className="text-lg font-medium mb-2">点击上传图片</span>
                    <span className="text-sm text-gray-400">或拖拽图片到此处</span>
                  </button>
                </div>
              )}
            </div>

            {/* 位置和天气 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 地点 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <span className="flex items-center">
                    <span className="text-lg mr-2">📍</span>
                    所在地点
                    <span className="text-gray-400 text-xs ml-2">记录美好发生的地方</span>
                  </span>
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="在哪里发生的呢？例如：北京市朝阳区"
                    className="w-full p-3 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent bg-white"
                    maxLength={50}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {locationLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          <span>获取中...</span>
                        </>
                      ) : (
                        <>
                          <span>📍</span>
                          <span>自动定位</span>
                        </>
                      )}
                    </button>
                    
                    {/* 常用地点快速选择 */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        '家里',
                        '公司',
                        '学校',
                        '北京市朝阳区国贸大街',
                        '上海市浦东新区陆家嘴路',
                        '广州市天河区天河路',
                        '深圳市南山区深南大道',
                        '杭州市西湖区西湖大道',
                        '咖啡店',
                        '购物中心',
                        '公园'
                      ].map((place) => (
                        <button
                          key={place}
                          type="button"
                          onClick={() => setLocation(place)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap"
                        >
                          {place.length > 8 ? place.substring(0, 8) + '...' : place}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 地点提示 */}
                  <div className="text-xs text-gray-500">
                    💡 提示：点击"自动定位"获取大致位置，或手动输入具体地址
                  </div>
                </div>
              </div>

              {/* 天气 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <span className="flex items-center">
                    <span className="text-lg mr-2">🌤️</span>
                    天气情况
                    <span className="text-gray-400 text-xs ml-2">当时的天气如何</span>
                  </span>
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    placeholder="今天天气怎么样？"
                    className="w-full p-3 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent bg-white"
                    maxLength={30}
                  />
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleGetWeather}
                      disabled={weatherLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {weatherLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                          <span>获取中...</span>
                        </>
                      ) : (
                        <>
                          <span>🌤️</span>
                          <span>获取天气</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 发布按钮区域 */}
            <div className="border-t border-yellow-100 pt-6">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  <span>←</span>
                  <span>返回首页</span>
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-pink-400 to-yellow-400 text-white rounded-full hover:from-pink-500 hover:to-yellow-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-lg font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>发布中...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>发布小确幸</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 贴心提示 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
            <span className="mr-2">💡</span>
            温馨提示
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 分享生活中让你感到幸福的小事情</li>
            <li>• 可以配上一张图片让回忆更生动</li>
            <li>• 记录下当时的地点和天气会更有纪念意义</li>
            <li>• 每一个小确幸都值得被珍藏 ✨</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 