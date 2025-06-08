'use client'

import { useState } from 'react'
import { Camera, MapPin, Cloud, Upload } from 'lucide-react'

const HomePage = () => {
  const [formData, setFormData] = useState({
    content: '',
    author: '',
    image: null as File | null,
    location: '',
    weather: ''
  })

  const [charCount, setCharCount] = useState(0)
  const [authorCharCount, setAuthorCharCount] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isGettingWeather, setIsGettingWeather] = useState(false)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= 100) {
      setFormData({ ...formData, content: value })
      setCharCount(value.length)
    }
  }

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 30) {
      setFormData({ ...formData, author: value })
      setAuthorCharCount(value.length)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, image: file })
    }
  }

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理位置功能')
      return
    }

    console.log('🌍 开始获取用户位置...')
    console.log('🔍 环境检测:')
    console.log('  - 浏览器:', navigator.userAgent)
    console.log('  - 是否支持GPS:', !!navigator.geolocation)
    console.log('  - 是否HTTPS:', location.protocol === 'https:')
    console.log('  - 当前域名:', location.hostname)
    console.log('  - 连接类型:', (navigator as any).connection?.effectiveType || '未知')
    
    setIsGettingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          console.log(`📍 GPS坐标获取成功: 纬度=${latitude}, 经度=${longitude}`)
          console.log(`📍 定位精度: ${position.coords.accuracy}米`)
          
          // 构建API请求URL
          const apiUrl = `http://localhost:8000/api/v1/location/reverse-geocode?latitude=${latitude}&longitude=${longitude}&lang=zh-CN`
          console.log(`🔗 准备调用后端API: ${apiUrl}`)
          
          // 调用后端API进行反向地理编码
          const response = await fetch(apiUrl)
          console.log(`📡 API响应状态: ${response.status} ${response.statusText}`)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ API请求失败详情:', {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText,
              url: apiUrl
            })
            
            throw new Error(`地理编码服务请求失败: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('📋 API返回的完整数据:', JSON.stringify(data, null, 2))
          
          if (data.data && data.data.formatted_address) {
            console.log(`✅ 成功解析地址: ${data.data.formatted_address}`)
            
            // 直接使用API返回的格式化地址，进行基本清理
            let cleanAddress = data.data.formatted_address
              .replace(/美利坚合众国\/美利堅合眾國/g, '美国')
              .replace(/纽约\/紐約/g, '纽约')
              .replace(/纽约州 \/ 紐約州/g, '纽约州')
              .replace(/，/g, ', ')  // 统一使用英文逗号和空格
            
            console.log(`🧹 地址清理后: ${cleanAddress}`)
            setFormData({ ...formData, location: cleanAddress })
          } else {
            console.error('❌ API返回数据格式异常:', data)
            setFormData({ ...formData, location: '位置信息解析失败' })
          }
        } catch (error) {
          console.error('❌ 获取地址失败:', error)
          setFormData({ ...formData, location: '地址获取失败，请检查网络连接' })
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        console.error('❌ GPS定位失败:', error)
        setIsGettingLocation(false)
        
        let errorMessage = '位置获取失败'
        let helpText = ''
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置权限被拒绝'
            helpText = '请在浏览器弹窗中点击"允许"来获取位置权限'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用'
            helpText = '请确保您的设备支持定位功能'
            break
          case error.TIMEOUT:
            errorMessage = '位置获取超时'
            helpText = '定位时间较长，可能是网络或防火墙问题。建议直接手动输入位置更快'
            break
        }
        
        // 提供用户友好的错误处理
        const fullMessage = helpText 
          ? `${errorMessage}\n\n💡 ${helpText}\n\n请手动输入您的位置:`
          : `${errorMessage}\n\n请手动输入您的位置:`
        
        const manualLocation = prompt(fullMessage, '上海市')
        
        if (manualLocation && manualLocation.trim()) {
          console.log(`✏️ 用户手动输入位置: ${manualLocation.trim()}`)
          setFormData({ ...formData, location: manualLocation.trim() })
        }
      },
      {
        enableHighAccuracy: false,  // 使用网络定位，更快更稳定
        timeout: 30000,  // 增加到30秒超时
        maximumAge: 300000  // 5分钟内的缓存位置可用，增加缓存时间
      }
    )
  }

  const handleGetWeather = async () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理位置功能，无法获取天气')
      return
    }

    setIsGettingWeather(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // 调用后端API获取天气信息
          const response = await fetch(
            `http://localhost:8000/api/v1/weather/current?latitude=${latitude}&longitude=${longitude}&units=metric&lang=zh_cn`
          )
          
          if (!response.ok) {
            throw new Error('天气服务请求失败')
          }
          
          const data = await response.json()
          
          if (data.data) {
            const { temperature, weather } = data.data
            const weatherText = `${weather.description} ${Math.round(temperature.current)}°C`
            setFormData({ ...formData, weather: weatherText })
          } else {
            setFormData({ ...formData, weather: '天气信息获取失败' })
          }
        } catch (error) {
          console.error('获取天气失败:', error)
          // 如果API调用失败，提供一个基于位置的简单天气信息
          setFormData({ ...formData, weather: '天气获取失败，请重试' })
        } finally {
          setIsGettingWeather(false)
        }
      },
      (error) => {
        console.error('获取位置失败:', error)
        setIsGettingWeather(false)
        
        let errorMessage = '位置获取失败，无法获取天气'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置权限被拒绝，请允许位置访问以获取天气'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用，无法获取天气'
            break
          case error.TIMEOUT:
            errorMessage = '位置获取超时，无法获取天气'
            break
        }
        
        const manualWeather = prompt(
          `${errorMessage}\n\n请手动输入天气信息:`, 
          '晴天 22°C'
        )
        
        if (manualWeather && manualWeather.trim()) {
          console.log(`✏️ 用户手动输入天气: ${manualWeather.trim()}`)
          setFormData({ ...formData, weather: manualWeather.trim() })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分钟缓存
      }
    )
  }

  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      alert('请输入幸福小事内容')
      return
    }

    setIsUploading(true)
    try {
      // 这里可以调用后端API上传数据
      console.log('提交数据:', formData)
      alert('上传成功！')
      
      // 重置表单
      setFormData({
        content: '',
        author: '',
        image: null,
        location: '',
        weather: ''
      })
      setCharCount(0)
      setAuthorCharCount(0)
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const getCurrentDateTime = () => {
    const now = new Date()
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-journal-yellow via-journal-pink to-journal-light-pink p-4">
      <div className="max-w-7xl mx-auto">
        {/* 侧边栏 */}
        <div className="fixed left-4 top-4 space-y-4 z-10">
          <div className="bg-yellow-200 rounded-2xl shadow-lg p-4 w-20">
            <div className="space-y-6">
              {/* 上传 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <span className="text-2xl">📝</span>
                </div>
                <span className="text-xs text-gray-700 mt-1 font-medium">上传</span>
              </div>
              
              {/* 搜索 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <span className="text-2xl">🔍</span>
                </div>
                <span className="text-xs text-gray-700 mt-1 font-medium">搜索</span>
              </div>
              
              {/* 我的 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <span className="text-2xl">📁</span>
                </div>
                <span className="text-xs text-gray-700 mt-1 font-medium">我的</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 text-center">
              <h1 className="text-3xl font-bold mb-2">幸福小事日记</h1>
              <p className="text-pink-100">记录每一个温暖的瞬间 💕</p>
            </div>
          </div>
        </div>

        {/* 主标题 */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <span className="text-black">Little </span>
            <span className="text-black">幸福小事</span>
            <span className="inline-block bg-red-500 text-white px-2 py-1 rounded ml-2 text-sm">📮</span>
            <span className="text-black">日记:</span>
          </h1>
          <p className="text-lg text-gray-600 italic">Joys Journal:</p>
        </div>

        <div className="flex gap-8 max-w-6xl mx-auto">
          {/* 左侧表单区域 */}
          <div className="flex-1 bg-white/80 rounded-2xl p-8 backdrop-blur-sm shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 bg-gray-100 rounded-lg p-4 text-center">
              写一件幸福小事
            </h2>

            {/* 文字输入区域 */}
            <div className="mb-6">
              <div className="relative">
                <textarea
                  value={formData.content}
                  onChange={handleContentChange}
                  placeholder="记录下你的幸福瞬间..."
                  className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-pink-300 focus:outline-none text-gray-700"
                />
                <div className="absolute bottom-2 right-4 text-sm text-gray-400">
                  {charCount}/100
                </div>
              </div>
            </div>

            {/* 署名区域 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">署名</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.author}
                  onChange={handleAuthorChange}
                  placeholder="请输入"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-pink-300 focus:outline-none text-gray-700"
                />
                <div className="absolute bottom-2 right-4 text-sm text-gray-400">
                  {authorCharCount}/30
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* 图片上传区域 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">图片</span>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-300 transition-colors"
                  >
                    <div className="text-center">
                      {formData.image ? (
                        <span className="text-green-600">已选择: {formData.image.name}</span>
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <span className="text-gray-400 text-sm">未添加图片</span>
                        </>
                      )}
                    </div>
                  </label>
                  <button
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="absolute bottom-2 right-2 text-blue-500 text-sm hover:text-blue-700"
                  >
                    点击上传图片
                  </button>
                </div>
              </div>

              {/* 天气区域 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">天气</span>
                </div>
                <div className="relative">
                  <div className="flex items-center justify-center w-full p-4 border-2 border-gray-200 rounded-lg">
                    <div className="text-center">
                      {formData.weather ? (
                        <span className="text-gray-700">{formData.weather}</span>
                      ) : (
                        <>
                          <Cloud className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <span className="text-gray-400 text-sm">未添加天气</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleGetWeather}
                    disabled={isGettingWeather}
                    className="absolute bottom-2 right-2 text-blue-500 text-sm hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGettingWeather ? '获取中...' : '点击自动获取天气'}
                  </button>
                </div>
              </div>
            </div>

            {/* 地点区域 */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">地点</span>
              </div>
              <div className="relative">
                <div className="flex items-center justify-center w-full p-4 border-2 border-gray-200 rounded-lg">
                  <div className="text-center">
                    {formData.location ? (
                      <span className="text-gray-700">{formData.location}</span>
                    ) : (
                      <>
                        <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-400 text-sm">未添加地点</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm w-full"
                  >
                    {isGettingLocation ? '获取中...' : '📍 获取当前位置'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 点击"获取当前位置"会使用你的真实GPS坐标进行定位
              </p>
            </div>

            {/* 确认上传按钮 */}
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-8 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                <Upload className="w-5 h-5" />
                <span>{isUploading ? '上传中...' : '确认上传'}</span>
              </button>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div className="w-80 bg-white/60 rounded-2xl p-6 backdrop-blur-sm shadow-lg h-fit">
            <div className="text-center mb-4">
              <span className="text-gray-600 text-sm">你的日记预览</span>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-500 mb-2">{getCurrentDateTime()}</div>
              <div className="text-gray-700 text-sm leading-relaxed">
                {formData.content || "下班时在地铁口看到了父辈的蛋卷大叔，10元立刻拿下一包，他今天的鼻子被风吹的红红的。"}
              </div>
            </div>

            <div className="text-right">
              <button className="bg-journal-purple text-white px-4 py-2 rounded-full text-sm hover:bg-purple-500 transition-colors">
                拓麻慧子
              </button>
            </div>
          </div>
        </div>

        {/* 底部联系信息 */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <span>联系</span>
            <span>Find Your Happy in the Little Things</span>
            <span>Joy Lives in the Details</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage 