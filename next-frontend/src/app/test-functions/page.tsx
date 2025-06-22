'use client'

import { useState } from 'react'

export default function TestFunctionsPage() {
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // 测试位置获取
  const testLocation = async () => {
    setLocationLoading(true)
    addResult('开始测试位置获取...')
    
    try {
      if (!navigator.geolocation) {
        throw new Error('您的浏览器不支持位置服务')
      }

      // 获取用户坐标
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      const { latitude, longitude } = position.coords
      addResult(`获取到坐标: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)

      // 调用API获取地址
      const response = await fetch(`/api/location?lat=${latitude}&lng=${longitude}`)
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setLocation(data.address)
        addResult(`✅ 位置获取成功: ${data.address}`)
      } else {
        throw new Error(data.error || '地址解析失败')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      addResult(`❌ 位置获取失败: ${errorMessage}`)
      setLocation('获取失败')
    } finally {
      setLocationLoading(false)
    }
  }

  // 测试天气获取
  const testWeather = async () => {
    setWeatherLoading(true)
    addResult('开始测试天气获取...')
    
    try {
      if (!navigator.geolocation) {
        throw new Error('您的浏览器不支持位置服务')
      }

      // 获取用户坐标
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      const { latitude, longitude } = position.coords
      addResult(`获取到坐标: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)

      // 调用API获取天气
      const response = await fetch(`/api/weather?lat=${latitude}&lng=${longitude}`)
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setWeather(data.weather)
        addResult(`✅ 天气获取成功: ${data.weather}`)
        addResult(`详细信息: ${JSON.stringify(data.details)}`)
      } else {
        throw new Error(data.error || '天气解析失败')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      addResult(`❌ 天气获取失败: ${errorMessage}`)
      setWeather('获取失败')
    } finally {
      setWeatherLoading(false)
    }
  }

  // 测试固定坐标
  const testFixedCoordinates = async () => {
    addResult('测试固定坐标（北京天安门）...')
    
    const lat = 39.9042
    const lng = 116.4074
    
    try {
      // 测试位置
      const locationResponse = await fetch(`/api/location?lat=${lat}&lng=${lng}`)
      const locationData = await locationResponse.json()
      addResult(`位置结果: ${JSON.stringify(locationData)}`)
      
      // 测试天气
      const weatherResponse = await fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      const weatherData = await weatherResponse.json()
      addResult(`天气结果: ${JSON.stringify(weatherData)}`)
      
    } catch (error) {
      addResult(`固定坐标测试失败: ${error}`)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            🧪 地点定位和天气功能测试
          </h1>
          
          {/* 测试按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testLocation}
              disabled={locationLoading}
              className="px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {locationLoading ? '📍 获取位置中...' : '📍 测试位置获取'}
            </button>
            
            <button
              onClick={testWeather}
              disabled={weatherLoading}
              className="px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {weatherLoading ? '🌤️ 获取天气中...' : '🌤️ 测试天气获取'}
            </button>
          </div>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={testFixedCoordinates}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
            >
              🎯 测试固定坐标
            </button>
            
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
            >
              🗑️ 清空日志
            </button>
          </div>
          
          {/* 当前结果显示 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold text-blue-800 mb-2">📍 当前位置</h3>
              <p className="text-blue-700">{location || '未获取'}</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-xl">
              <h3 className="font-semibold text-orange-800 mb-2">🌤️ 当前天气</h3>
              <p className="text-orange-700">{weather || '未获取'}</p>
            </div>
          </div>
          
          {/* 测试日志 */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">📝 测试日志</h2>
            <div className="max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 italic">暂无测试记录</p>
              ) : (
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 说明 */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 使用说明</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• 点击"测试位置获取"按钮，浏览器会请求您的位置权限</li>
              <li>• 点击"测试天气获取"按钮，同样需要位置权限来获取当前位置的天气</li>
              <li>• 点击"测试固定坐标"测试API是否正常工作（不需要位置权限）</li>
              <li>• 如果功能不正常，请查看测试日志中的详细错误信息</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 