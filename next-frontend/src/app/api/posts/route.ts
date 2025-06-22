import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 强制动态渲染，避免静态生成问题
export const dynamic = 'force-dynamic';

// 获取API基础URL - 与lib/api.ts保持一致的逻辑
const getApiBaseUrl = () => {
  // 优先使用环境变量中的API URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // 服务端环境检测
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL
  }
  
  // 默认回退到本地开发环境
  return 'http://localhost:8000'
}

// GET - 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortType = searchParams.get('sort_type') || 'latest'
    const userId = searchParams.get('user_id')

    // 调用后端API
    const backendUrl = getApiBaseUrl()
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_type: sortType,
      ...(userId && { user_id: userId })
    })

    const response = await fetch(`${backendUrl}/api/v1/posts?${params}`)
    
    if (!response.ok) {
      throw new Error(`后端API响应错误: ${response.status}`)
    }

    const data = await response.json()
    
    // 直接返回后端的数据格式，不需要额外包装
    return NextResponse.json(data)
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    return NextResponse.json({
      success: false,
      message: '获取帖子列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// POST - 创建新帖子
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { content, image, location, weather } = requestData

    // 验证必需字段
    if (!content || !content.trim()) {
      return NextResponse.json({
        success: false,
        message: '内容不能为空'
      }, { status: 400 })
    }

    if (content.length > 500) {
      return NextResponse.json({
        success: false,
        message: '内容不能超过500字'
      }, { status: 400 })
    }

    // 获取用户认证信息
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 从请求头获取authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        message: '未登录，请先登录'
      }, { status: 401 })
    }

    // TODO: 处理图片上传到存储服务
    let imageUrl = null
    if (image) {
      // 这里应该上传图片到Supabase Storage或其他存储服务
      // 暂时跳过图片上传功能
      console.log('图片上传功能待实现')
    }

    // 准备发送到后端的数据
    const postData = {
      content: content.trim(),
      image_url: imageUrl,
      location_data: location ? { name: location } : null,
      weather_data: weather ? { description: weather, temperature: 22 } : null
    }

    // 调用后端API创建帖子
    const backendUrl = getApiBaseUrl()
    const response = await fetch(`${backendUrl}/api/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(postData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `后端API响应错误: ${response.status}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      message: '发布成功！',
      data: result.data
    })

  } catch (error) {
    console.error('创建帖子失败:', error)
    return NextResponse.json({
      success: false,
      message: '发布失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 