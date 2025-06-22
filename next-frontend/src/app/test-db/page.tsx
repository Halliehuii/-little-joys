'use client'

import { useState } from 'react'

export default function TestDatabase() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-env')
      const envData = await response.json()
      
      const simpleResponse = await fetch('/api/simple-test')
      const simpleData = await simpleResponse.json()
      
      setTestResult({
        env: envData,
        simple: simpleData,
        timestamp: new Date().toLocaleString()
      })
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : '测试失败'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          数据库连接测试
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? '测试中...' : '测试数据库连接'}
          </button>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            如果连接失败，请检查：
          </h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>Supabase项目是否正常运行</li>
            <li>API密钥是否正确且未过期</li>
            <li>项目URL是否正确</li>
            <li>是否在Supabase中创建了必要的数据库表</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            数据库建表说明：
          </h3>
          <p className="text-blue-700 mb-2">
            如果表不存在，请在Supabase SQL编辑器中执行database_design.md文件中的建表语句。
          </p>
          <p className="text-blue-700">
            特别注意先创建user_profiles表，它是其他表的基础。
          </p>
        </div>
      </div>
    </div>
  )
} 