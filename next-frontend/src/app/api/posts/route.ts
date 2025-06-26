import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 强制动态渲染，避免静态生成问题
export const dynamic = 'force-dynamic';

// 获取API基础URL
const getApiBaseUrl = () => {
  // 在开发环境中使用localhost
  if (process.env.NODE_ENV === 'development') {
    return process.env.BACKEND_URL || 'http://localhost:8000'
  }
  
  // 在生产环境中使用生产环境API URL
  return process.env.BACKEND_URL || 'https://api.littlejoys.xyz'
}

// GET - 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'
    const sortType = searchParams.get('sort_type') || 'latest'
    const userId = searchParams.get('user_id')

    // 构建查询参数
    const params = new URLSearchParams({
      page,
      limit,
      sort_type: sortType
    })

    if (userId) {
      params.append('user_id', userId)
    }

    // 调用后端API
    const backendUrl = getApiBaseUrl()
    const response = await fetch(`${backendUrl}/api/v1/posts?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `后端API响应错误: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data.data,
      message: data.message
    })

  } catch (error) {
    console.error('获取帖子列表失败:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '获取帖子列表失败'
    }, { status: 500 })
  }
}

// 上传图片到Supabase Storage
async function uploadImageToStorage(imageFile: File, userId: string): Promise<string | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 生成唯一的文件名
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}/${userId}/${fileName}`

    // 上传文件到Supabase Storage
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('图片上传失败:', error)
      return null
    }

    // 获取公共URL
    const { data: publicUrlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('图片上传过程中出错:', error)
    return null
  }
}

// POST - 创建新帖子
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const content = formData.get('content') as string
    const image = formData.get('image') as File | null
    const location = formData.get('location') as string | null
    const weather = formData.get('weather') as string | null

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

    // 从请求头获取authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        message: '未登录，请先登录'
      }, { status: 401 })
    }

    // 解析token获取用户ID
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 验证token并获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: '认证失败，请重新登录'
      }, { status: 401 })
    }

    // 处理图片上传
    let imageUrl = null
    if (image && image.size > 0) {
      // 验证图片格式和大小
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(image.type)) {
        return NextResponse.json({
          success: false,
          message: '只支持JPG和PNG格式的图片'
        }, { status: 400 })
      }

      if (image.size > 5 * 1024 * 1024) { // 5MB
        return NextResponse.json({
          success: false,
          message: '图片大小不能超过5MB'
        }, { status: 400 })
      }

      imageUrl = await uploadImageToStorage(image, user.id)
      if (!imageUrl) {
        return NextResponse.json({
          success: false,
          message: '图片上传失败，请重试'
        }, { status: 500 })
      }
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
      data: result.data,
      message: result.message || '发布成功'
    })

  } catch (error) {
    console.error('创建帖子失败:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '创建帖子失败'
    }, { status: 500 })
  }
} 