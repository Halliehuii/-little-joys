'use client'

import { useState } from 'react'
import { getApiBaseUrl } from '@/lib/api'

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
    
    const apiBaseUrl = getApiBaseUrl()
    
    for (const loc of testLocations) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/v1/location/reverse-geocode?latitude=${loc.lat}&longitude=${loc.lon}&lang=zh-CN`
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
    const apiBaseUrl = getApiBaseUrl()
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `${apiBaseUrl}/api/v1/location/reverse-geocode?latitude=${latitude}&longitude=${longitude}&lang=zh-CN`
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">位置服务测试</h1>
          <p className="text-gray-600 mb-6">测试地理编码API的功能</p>
          <p className="text-sm text-blue-600 mb-6">当前API地址: {getApiBaseUrl()}</p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={testAllLocations}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? '测试中...' : '测试所有位置'}
            </button>
            
            <button
              onClick={testUserLocation}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? '获取中...' : '测试当前位置'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">测试结果</h2>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{result.name}</h3>
                        <p className="text-gray-600 mt-1">{result.location}</p>
                      </div>
                      <span className="text-sm">{result.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 