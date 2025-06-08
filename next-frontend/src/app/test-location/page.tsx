'use client'

import { useState } from 'react'

export default function TestLocationPage() {
  const [results, setResults] = useState<Array<{ name: string; location: string; status: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const testLocations = [
    { name: '上海 - 人民广场', lat: 31.2304, lon: 121.4737 },
    { name: '北京 - 天安门', lat: 39.9042, lon: 116.4074 },
    { name: '东京 - 新宿', lat: 35.6762, lon: 139.6503 },
    { name: '纽约 - 时代广场', lat: 40.7589, lon: -73.9851 },
    { name: '伦敦 - 大本钟', lat: 51.4994, lon: -0.1245 },
    { name: '巴黎 - 埃菲尔铁塔', lat: 48.8584, lon: 2.2945 }
  ]

  const testAllLocations = async () => {
    setIsLoading(true)
    setResults([])
    
    for (const loc of testLocations) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/location/reverse-geocode?latitude=${loc.lat}&longitude=${loc.lon}&lang=zh-CN`
        )
        
        if (response.ok) {
          const data = await response.json()
          setResults(prev => [...prev, {
            name: loc.name,
            location: data.data.formatted_address,
            status: '✅ 成功'
          }])
        } else {
          setResults(prev => [...prev, {
            name: loc.name,
            location: `HTTP ${response.status}`,
            status: '❌ 失败'
          }])
        }
      } catch (error) {
        setResults(prev => [...prev, {
          name: loc.name,
          location: error instanceof Error ? error.message : '未知错误',
          status: '❌ 异常'
        }])
      }
    }
    
    setIsLoading(false)
  }

  const testUserLocation = () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理位置功能')
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `http://localhost:8000/api/v1/location/reverse-geocode?latitude=${latitude}&longitude=${longitude}&lang=zh-CN`
          )
          
          if (response.ok) {
            const data = await response.json()
            setResults([{
              name: `您的位置 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              location: data.data.formatted_address,
              status: '✅ 成功'
            }])
          } else {
            setResults([{
              name: '您的位置',
              location: `HTTP ${response.status}`,
              status: '❌ 失败'
            }])
          }
        } catch (error) {
          setResults([{
            name: '您的位置',
            location: error instanceof Error ? error.message : '未知错误',
            status: '❌ 异常'
          }])
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        let errorMessage = '位置获取失败'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置权限被拒绝'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用'
            break
          case error.TIMEOUT:
            errorMessage = '位置获取超时'
            break
        }
        
        setResults([{
          name: '您的位置',
          location: errorMessage,
          status: '❌ 失败'
        }])
        setIsLoading(false)
      }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            地点获取功能测试页面
          </h1>
          
          <div className="space-y-4 mb-8">
            <button
              onClick={testUserLocation}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 text-lg font-semibold"
            >
              {isLoading ? '获取中...' : '🎯 测试获取您的真实位置'}
            </button>
            
            <button
              onClick={testAllLocations}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 text-lg font-semibold"
            >
              {isLoading ? '测试中...' : '🌍 测试全球多个城市位置'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">测试结果：</h2>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">{result.name}</h3>
                        <p className="text-gray-600 mt-1">{result.location}</p>
                      </div>
                      <span className="text-sm font-medium">{result.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              ← 返回主页
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 